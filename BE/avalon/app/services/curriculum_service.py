from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status, UploadFile
from sqlalchemy import func
import csv
import io
import math
from collections import defaultdict
from datetime import datetime

from ..models.class_model import Class as ClassModel
from ..models.curriculum import Curriculum
from ..models.curriculum_detail import CurriculumDetail
from ..models.homework import Homework
from ..models.todo import Todo, TodoType
from ..models.subject import Subject
from ..schemas.curriculum import Curriculum as CurriculumSchema
from ..schemas.curriculum import CurriculumCreate, CurriculumUpdate

class CurriculumService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def import_curriculum_from_csv(self, file: UploadFile, type: Optional[str] = None, curriculum_name: Optional[str] = None):
        content = await file.read()
        encodings_to_try = ["utf-8", "cp949", "euc-kr"]
        decoded_content = None
        for encoding in encodings_to_try:
            try:
                decoded_content = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        if decoded_content is None:
            raise HTTPException(status_code=400, detail="CSV 파일 인코딩을 지원하지 않습니다. (utf-8, cp949, euc-kr)")

        reader = csv.DictReader(io.StringIO(decoded_content))
        reader.fieldnames = [field.strip() for field in reader.fieldnames]
        errors = []
        rows_to_process = list(reader)
        
        # --- 1. Validation Phase ---
        if not rows_to_process:
            raise HTTPException(status_code=400, detail="CSV file is empty.")

        subject_result = await self.db.execute(select(Subject))
        subject_cache = {s.subject_name.strip(): s.subject_id for s in subject_result.scalars().all()}
        last_day_for_subject: Dict[str, int] = defaultdict(int)
        
        # Validate first row and set curriculum name
        # curriculum_name 파라미터가 있으면 우선 사용, 없으면 기존 방식대로 파일 내부에서 추출
        if curriculum_name and curriculum_name.strip():
            first_row_name = curriculum_name.strip()
        else:
            first_row_name = rows_to_process[0].get('커리큘럼 이름', '').strip()
            if not first_row_name:
                raise HTTPException(status_code=400, detail="'커리큘럼 이름'은 첫 번째 행에서 필수입니다.")
        # 커리큘럼 이름 길이 제한 (100자)
        if len(first_row_name) > 100:
            raise HTTPException(status_code=400, detail="'커리큘럼 이름'은 100자 이하로 입력해야 합니다.")
        curri_result = await self.db.execute(
            select(Curriculum).where(
                Curriculum.curriculum_name == first_row_name,
                Curriculum.deleted_at == None
            )
        )
        existing_curri = curri_result.scalars().first()
        if existing_curri:
            raise HTTPException(status_code=400, detail=f"커리큘럼 '{first_row_name}'이/가 이미 존재합니다.")

        for i, row in enumerate(rows_to_process):
            row_num = i + 2
            # --- Basic row validation ---
            subject_str = row.get('SUBJECT', '').strip()
            # SUBJECT 길이 제한 (100자)
            if len(subject_str) > 100:
                errors.append(f"Row {row_num}: 'SUBJECT'는 100자 이하로 입력해야 합니다.")
            if not subject_str:
                errors.append(f"Row {row_num}: 'SUBJECT'는 비어 있을 수 없습니다.")
                continue # 과목이 빈 칸이면 해당 DAY 검증은 건너뜀
            elif subject_str not in subject_cache:
                errors.append(f"Row {row_num}: 과목 '{subject_str}'이/가 데이터베이스에 없습니다.")

            progress_str = row.get('PROGRESS', '').strip()
            # PROGRESS 길이 제한 (100자)
            if len(progress_str) > 100:
                errors.append(f"Row {row_num}: 'PROGRESS'는 100자 이하로 입력해야 합니다.")
            if not progress_str:
                errors.append(f"Row {row_num}: 'PROGRESS'는 비어 있을 수 없습니다.")

            # --- DAY continuity validation ---
            day_str = row.get('DAY', '').strip()
            if not day_str.isdigit():
                errors.append(f"Row {row_num}: 'DAY'는 숫자만 입력할 수 있습니다.")
            else:
                day = int(day_str)
                if last_day_for_subject[subject_str] == 0 and day != 1:
                    errors.append(f"Row {row_num}: '{subject_str}' 과목의 첫 번째 'DAY'는 1이어야 합니다.")
                elif last_day_for_subject[subject_str] > 0 and last_day_for_subject[subject_str] + 1 != day:
                    errors.append(f"Row {row_num}: '{subject_str}' 과목의 'DAY'는 연속적이어야 합니다. 예상 {last_day_for_subject[subject_str] + 1}, 실제 {day}.")
                last_day_for_subject[subject_str] = day

            # --- Homework format validation ---
            homework_content = row.get('HOMEWORK', '').strip()
            # 숙제가 없으면 빈칸 또는 NO HOMEWORK 허용
            if homework_content and 'NO HOMEWORK' not in homework_content.upper():
                hw_items = [item.strip() for item in homework_content.split('- ') if item.strip()]
                for hw_item in hw_items:
                    parts = [p.strip() for p in hw_item.split('|')]
                    if len(parts) < 3:
                        errors.append(f"Row {row_num}: '{hw_item}'은 유효하지 않은 숙제 포멧입니다. 최소 3개의 파트가 필요합니다: [Abbr] | IsOnline | Title")
                        continue
                    # tag_name 길이 제한 (20자)
                    tag_name = parts[0].replace('[', '').replace(']', '').strip()
                    if len(tag_name) > 20:
                        errors.append(f"Row {row_num}: HOMEWORK 약자는 20자 이하로 입력해야 합니다. (내용: '{tag_name}')")
                    # homework_name 길이 제한 (100자)
                    homework_name = parts[2]
                    if len(homework_name) > 100:
                        errors.append(f"Row {row_num}: HOMEWORK 제목은 100자 이하로 입력해야 합니다. (내용: '{homework_name}')")
                    # homework_contents 길이 제한 (textfield지만 2000자)
                    homework_contents = parts[3] if len(parts) > 3 else None
                    if homework_contents and len(homework_contents) > 2000:
                        errors.append(f"Row {row_num}: HOMEWORK 설명은 2000자 이하로 입력해야 합니다. (내용: '{homework_contents[:50]}...')")

        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        # --- 2. Insertion Phase ---
        try:
            curri_type = type.lower() if type else None
            if curri_type:
                new_curriculum = Curriculum(curriculum_name=first_row_name, type=curri_type)
            else:
                new_curriculum = Curriculum(curriculum_name=first_row_name)
            self.db.add(new_curriculum)
            await self.db.flush()

            # Group by subject to handle tail-end filling
            grouped_data = defaultdict(list)
            for row in rows_to_process:
                grouped_data[row['SUBJECT'].strip()].append(row)

            for subject_name, rows in grouped_data.items():
                subject_id = subject_cache[subject_name]
                rows.sort(key=lambda r: int(r['DAY']))
                last_row_in_group = None
                for row in rows:
                    await self._insert_curriculum_detail_and_related(new_curriculum.curriculum_id, subject_id, int(row['DAY']), row)
                    last_row_in_group = row

                # Fill from last day to the next multiple of 13
                if last_row_in_group:
                    last_day = int(last_row_in_group['DAY'])
                    next_multiple_of_13 = math.ceil(last_day / 13) * 13
                    if next_multiple_of_13 == 0: next_multiple_of_13 = 13
                    for fill_day in range(last_day + 1, next_multiple_of_13 + 1):
                        await self._insert_curriculum_detail_and_related(new_curriculum.curriculum_id, subject_id, fill_day, last_row_in_group)

            await self.db.commit()
            return {"message": f"Curriculum '{first_row_name}' created successfully."}
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred during database insertion: {e}")

    async def _insert_curriculum_detail_and_related(self, curriculum_id: int, subject_id: int, day: int, row_data: dict):
        progress = row_data.get('PROGRESS', '').strip()
        curri_detail = CurriculumDetail(curriculum_id=curriculum_id, subject_id=subject_id, day=day, progress=progress)
        self.db.add(curri_detail)
        await self.db.flush()

        # Todo 등록 및 검증
        todo_columns = [
            ('NOTICE', TodoType.NOTICE),
            ('BEFORE CLASS', TodoType.BEFORE),
            ('IN-CLASS', TodoType.IN)
        ]
        for col_name, todo_type_enum in todo_columns:
            todo_content = row_data.get(col_name, '').strip()
            if todo_content:
                # 중복 체크
                result = await self.db.execute(select(Todo).where(
                    Todo.curri_detail_id == curri_detail.curri_detail_id,
                    Todo.subject_id == subject_id,
                    Todo.todo_type == todo_type_enum,
                    Todo.todo_thing == todo_content
                ))
                existing_todo = result.scalars().first()
                if not existing_todo:
                    todo = Todo(
                        curri_detail_id=curri_detail.curri_detail_id,
                        subject_id=subject_id,
                        todo_type=todo_type_enum,
                        todo_thing=todo_content
                    )
                    self.db.add(todo)

        # Homework 등록 및 검증
        homework_content = row_data.get('HOMEWORK', '').strip()
        if homework_content:
            hw_items = [item.strip() for item in homework_content.split('- ') if item.strip()]
            for hw_item in hw_items:
                parts = [p.strip() for p in hw_item.split('|')]
                if len(parts) >= 3:
                    tag_name = parts[0].replace('[', '').replace(']', '').strip()
                    is_online = parts[1].lower() == 'on'
                    homework_name = parts[2]
                    homework_contents = parts[3] if len(parts) > 3 else None
                    # 중복 체크
                    result = await self.db.execute(select(Homework).where(
                        Homework.curri_detail_id == curri_detail.curri_detail_id,
                        Homework.subject_id == subject_id,
                        Homework.tag_name == tag_name,
                        Homework.is_online == is_online,
                        Homework.homework_name == homework_name,
                        Homework.homework_contents == homework_contents
                    ))
                    existing_homework = result.scalars().first()
                    if not existing_homework:
                        new_homework = Homework(
                            curri_detail_id=curri_detail.curri_detail_id,
                            subject_id=subject_id,
                            tag_name=tag_name,
                            is_online=is_online,
                            homework_name=homework_name,
                            homework_contents=homework_contents
                        )
                        self.db.add(new_homework)

    async def get_curriculum(self, curriculum_id: int) -> Curriculum:
        result = await self.db.execute(select(Curriculum).where(Curriculum.curriculum_id == curriculum_id))
        curriculum = result.scalars().first()
        if not curriculum:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curriculum not found")
        return curriculum

    async def get_all_curriculums(self, skip: int = 0, limit: int = 100) -> List[dict]:
        result = await self.db.execute(select(Curriculum).where(Curriculum.deleted_at == None).offset(skip).limit(limit))
        curriculums = result.scalars().all()
        curriculum_ids = [c.curriculum_id for c in curriculums]
        if not curriculum_ids:
            return []
        class_count_result = await self.db.execute(
            select(ClassModel.curriculum_id, func.count()).where(ClassModel.curriculum_id.in_(curriculum_ids)).group_by(ClassModel.curriculum_id)
        )
        class_count_map = dict(class_count_result.all())
        result_list = []
        for curri in curriculums:
            result_list.append(
                CurriculumSchema(
                    curriculum_id=curri.curriculum_id,
                    curriculum_name=curri.curriculum_name,
                    type=curri.type,
                    created_at=curri.created_at,
                    deleted_at=curri.deleted_at,
                    used_class_count=class_count_map.get(curri.curriculum_id, 0)
                )
            )
        return result_list

    async def create_curriculum(self, curriculum_data: CurriculumCreate) -> Curriculum:
        result = await self.db.execute(select(Curriculum).where(
            Curriculum.curriculum_name == curriculum_data.curriculum_name,
            Curriculum.deleted_at == None
        ))
        existing_curriculum = result.scalars().first()
        if existing_curriculum:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Curriculum with the same name already exists")

        db_curriculum = Curriculum(**curriculum_data.model_dump())
        self.db.add(db_curriculum)
        await self.db.commit()
        await self.db.refresh(db_curriculum)
        return db_curriculum

    async def update_curriculum(self, curriculum_id: int, curriculum_data: CurriculumUpdate) -> Curriculum:
        db_curriculum = await self.get_curriculum(curriculum_id)
        update_data = curriculum_data.model_dump(exclude_unset=True)
        if "curriculum_name" in update_data:
            result = await self.db.execute(select(Curriculum).where(
                Curriculum.curriculum_name == update_data["curriculum_name"],
                Curriculum.curriculum_id != curriculum_id,
                Curriculum.deleted_at == None
            ))
            existing_curriculum = result.scalars().first()
            if existing_curriculum:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another curriculum with this name already exists")
        for key, value in update_data.items():
            setattr(db_curriculum, key, value)
        await self.db.commit()
        await self.db.refresh(db_curriculum)
        return db_curriculum


    async def delete_curriculum(self, curriculum_id: int):
        db_curriculum = await self.get_curriculum(curriculum_id)
        # Delete related Homework
        await self.db.execute(
            Homework.__table__.delete().where(
                Homework.curri_detail_id.in_(
                    select(CurriculumDetail.curri_detail_id).where(CurriculumDetail.curriculum_id == curriculum_id)
                )
            )
        )
        # Delete related Todo
        await self.db.execute(
            Todo.__table__.delete().where(
                Todo.curri_detail_id.in_(
                    select(CurriculumDetail.curri_detail_id).where(CurriculumDetail.curriculum_id == curriculum_id)
                )
            )
        )
        # Delete related CurriculumDetail
        await self.db.execute(
            CurriculumDetail.__table__.delete().where(CurriculumDetail.curriculum_id == curriculum_id)
        )
        await self.db.delete(db_curriculum)
        await self.db.commit()
        return {"detail": "Curriculum and related data successfully deleted"}

    async def soft_delete_curriculum(self, curriculum_id: int):
        db_curriculum = await self.get_curriculum(curriculum_id)
        db_curriculum.deleted_at = func.now()
        created_at = db_curriculum.created_at if hasattr(db_curriculum, 'created_at') else None
        if created_at:
            dt_str = created_at.strftime('%Y%m%dT%H%M%S')
        else:
            dt_str = datetime.now().strftime('%Y%m%dT%H%M%S')
        db_curriculum.curriculum_name = f"{db_curriculum.curriculum_name}-{dt_str}"
        await self.db.commit()
        return {"detail": f"Curriculum {curriculum_id} soft deleted. Name changed to {db_curriculum.curriculum_name}"}
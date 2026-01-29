from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional

router = APIRouter()

# ========== 데모용 하드코딩 데이터 ==========
# curriculum_details의 각 항목에 대한 todos 데이터
DEMO_TODOS = [
    # WAVE LANGUAGE ARTS (curriculum_id: 27, subject_id: 2)
    # curri_detail_id: 1
    {"todo_id": 1, "curri_detail_id": 1, "subject_id": 2, "todo_type": "NOTICE", "todo_thing": "1. 온라인 학습: 앱 스토어 검색 : MVA > 설치 후 로그인 사용\n2. 발음영상 올리기 ( JOURNEYS 교재 p.14~23)"},
    {"todo_id": 2, "curri_detail_id": 1, "subject_id": 2, "todo_type": "BEFORE", "todo_thing": "TODAY IS READING DAY. MAKE SURE TO GO THROUGH JOURNEYS BOOK AS A WHOLE IN CLASS."},
    {"todo_id": 3, "curri_detail_id": 1, "subject_id": 2, "todo_type": "IN", "todo_thing": "□ READING DAY ( JOURNEYS BOOK p.14~29, 34~36 )"},
    
    # curri_detail_id: 2
    {"todo_id": 4, "curri_detail_id": 2, "subject_id": 2, "todo_type": "NOTICE", "todo_thing": "발음영상 올리기 ( JOURNEYS 교재 p.24-29)"},
    {"todo_id": 5, "curri_detail_id": 2, "subject_id": 2, "todo_type": "BEFORE", "todo_thing": "□Check Online HW on the HW Checklist\n□Foreign LA teachers only upload COLUMBUS pronunciation video feedback in the comment section once a week in BAND."},
    {"todo_id": 6, "curri_detail_id": 2, "subject_id": 2, "todo_type": "IN", "todo_thing": "□ TEACH: Language Arts Pre-Starter LESSON 11 Warm Up ~ Vocabulary in Context (p.16 ~ 19)\n□ [IMPORTANT] PLEASE TEACH HOMEWORK SECTION IN CLASS."},
    
    # curri_detail_id: 3
    {"todo_id": 7, "curri_detail_id": 3, "subject_id": 2, "todo_type": "NOTICE", "todo_thing": "발음영상 올리기 ( JOURNEYS 교재 p.34~36)"},
    {"todo_id": 8, "curri_detail_id": 3, "subject_id": 2, "todo_type": "BEFORE", "todo_thing": "□Check Online HW on the HW Checklist"},
    {"todo_id": 9, "curri_detail_id": 3, "subject_id": 2, "todo_type": "IN", "todo_thing": "□ TEACH: Language Arts Pre-Starter LESSON 11 Grammar Focus ~ Grammar Practice (p.22 ~ 25)\n□ Check Online HW on the HW Checklist & Stamp their HW Calendars in the book"},
    
    # curri_detail_id: 4
    {"todo_id": 10, "curri_detail_id": 4, "subject_id": 2, "todo_type": "NOTICE", "todo_thing": "발음영상 올리기 ( JOURNEYS 교재 p.14~23)"},
    {"todo_id": 11, "curri_detail_id": 4, "subject_id": 2, "todo_type": "BEFORE", "todo_thing": "□Check Online HW on the HW Checklist"},
    {"todo_id": 12, "curri_detail_id": 4, "subject_id": 2, "todo_type": "IN", "todo_thing": "□ READ JOURNEY'S LESSON 11 \"At Home in the Ocean\" p.14-23\n□ TEACH: Language Arts Pre-Starter LESSON 11 Comprehension: Text 1 ~ Making Connections 1 (p.28 ~ 31)"},
    
    # curri_detail_id: 5
    {"todo_id": 13, "curri_detail_id": 5, "subject_id": 2, "todo_type": "NOTICE", "todo_thing": "발음영상 올리기 ( JOURNEYS 교재 p.24-29)"},
    {"todo_id": 14, "curri_detail_id": 5, "subject_id": 2, "todo_type": "BEFORE", "todo_thing": "□Check Online HW on the HW Checklist"},
    {"todo_id": 15, "curri_detail_id": 5, "subject_id": 2, "todo_type": "IN", "todo_thing": "□ READ JOURNEY'S LESSON 11 \"At Home in the Ocean\" p.24~29\n□ TEACH: Language Arts Pre-Starter LESSON 11 Comprehension: Text 2 ~ Making Connections 2 (p.34 ~ 37)"},
    
    # WAVE SCIENCE (curriculum_id: 28, subject_id: 4)
    # curri_detail_id: 101
    {"todo_id": 101, "curri_detail_id": 101, "subject_id": 4, "todo_type": "NOTICE", "todo_thing": "[ 다음 SCIENCE 시간에 단어시험 공지s ]\nLanguage Arts_ Lesson 16 (No. 1~12) VITAMIN p.4"},
    {"todo_id": 102, "curri_detail_id": 101, "subject_id": 4, "todo_type": "BEFORE", "todo_thing": "[ PRINT ]\n□ Print 첫날 교재 미리 출력"},
    {"todo_id": 103, "curri_detail_id": 101, "subject_id": 4, "todo_type": "IN", "todo_thing": "□ Stamp their HW Calendars in their book\n□ TEACH SCIENCE LESSON 1A (Warm UP-Focus on Reading) p. 9-13\n□ DO IN CLASS : LANGCON POWER - Chapter 1A"},
    
    # curri_detail_id: 102
    {"todo_id": 104, "curri_detail_id": 102, "subject_id": 4, "todo_type": "NOTICE", "todo_thing": "[ 오늘의 단어시험 TODAY'S VOCA TEST ]\nLanguage Arts_ Lesson 16 (No. 1~12) VITAMIN p.4"},
    {"todo_id": 105, "curri_detail_id": 102, "subject_id": 4, "todo_type": "BEFORE", "todo_thing": "[ PRINT ]VOCA TEST\nLanguage Arts _ Lesson 11 (No. 1~12)\n□ [ CHECK ONLINE HW ] MVA ( VITAMIN 단어 온라인 )"},
    {"todo_id": 106, "curri_detail_id": 102, "subject_id": 4, "todo_type": "IN", "todo_thing": "[ IMPORTANT] RUN VOCA TEST & DO LANGCON POWER AND TEXTBOOK HOMEWORK SECTION IN CLASS.\n□Check Textbook/Offline HW & Stamp their HW Calendars in their book\n□TEACH SCIENCE LESSON 1B (Focus on Reading - Present the Ideas ) p. 14-18"},
    
    # curri_detail_id: 103
    {"todo_id": 107, "curri_detail_id": 103, "subject_id": 4, "todo_type": "NOTICE", "todo_thing": "[ 오늘의 단어시험 TODAY'S VOCA TEST ]\nLanguage Arts_ Lesson 16 (No. 13~24) VITAMIN p.5"},
    {"todo_id": 108, "curri_detail_id": 103, "subject_id": 4, "todo_type": "BEFORE", "todo_thing": "[ PRINT ]VOCA TEST\nLanguage Arts _Lesson 11 (No. 13~24)"},
    {"todo_id": 109, "curri_detail_id": 103, "subject_id": 4, "todo_type": "IN", "todo_thing": "[ IMPORTANT] RUN VOCA TEST & DO LANGCON POWER AND TEXTBOOK HOMEWORK SECTION IN CLASS.\n□Check Textbook/Offline HW\n□ Stamp their HW Calendars in their book\n□ TEACH SCIENCE LESSON 2A (Warm UP-Focus on Reading) p.23-27"},
    
    # WAVE SOCIAL STUDIES (curriculum_id: 29, subject_id: 5)
    # curri_detail_id: 201
    {"todo_id": 201, "curri_detail_id": 201, "subject_id": 5, "todo_type": "NOTICE", "todo_thing": "[ 다음 SOCIAL STUDIES 시간 단어시험 NEXT VOCA TEST ]\nVITAMIN VOCA SOCIAL STUDIES CHAPTER 1 (p.24)"},
    {"todo_id": 202, "curri_detail_id": 201, "subject_id": 5, "todo_type": "BEFORE", "todo_thing": "[ PRINT ]\n□ Print 첫날 교재 미리 출력"},
    {"todo_id": 203, "curri_detail_id": 201, "subject_id": 5, "todo_type": "IN", "todo_thing": "□ TEACH SOCIAL STUDIES LESSON 1A (Warm Up - Focus on Reading) p. 9-13\n□ LANGCON POWER - Chapter 1A"},
    
    # curri_detail_id: 202
    {"todo_id": 204, "curri_detail_id": 202, "subject_id": 5, "todo_type": "NOTICE", "todo_thing": "[ 오늘의 단어시험 ]\nVITAMIN VOCA SOCIAL STUDIES CHAPTER 1 (p.24)"},
    {"todo_id": 205, "curri_detail_id": 202, "subject_id": 5, "todo_type": "BEFORE", "todo_thing": "[ PRINT ]VOCA TEST\nLanguage Arts _ Lesson 11 (No. 1~12)\n□ [ CHECK ONLINE HW ] MVA ( VITAMIN 단어 온라인 )"},
    {"todo_id": 206, "curri_detail_id": 202, "subject_id": 5, "todo_type": "IN", "todo_thing": "[ RUN ] VOCA TEST\n□Check Textbook/Offline HW\n□Stamp their HW Calendars in their book\n□TEACH SOCIAL STUDIES LESSON 1B (Focus on Reading - Present the Ideas) p. 14-18"},
    
    # curri_detail_id: 203
    {"todo_id": 207, "curri_detail_id": 203, "subject_id": 5, "todo_type": "NOTICE", "todo_thing": "[ 오늘의 단어시험 ]\nVITAMIN VOCA SCIENCE CHAPTER 1 (p.16)"},
    {"todo_id": 208, "curri_detail_id": 203, "subject_id": 5, "todo_type": "BEFORE", "todo_thing": "[ PRINT ]VOCA TEST\nLanguage Arts _Lesson 11 (No. 13~24)"},
    {"todo_id": 209, "curri_detail_id": 203, "subject_id": 5, "todo_type": "IN", "todo_thing": "[ RUN ] VOCA TEST\n□Check Textbook/Offline HW\n□ Stamp their HW Calendars in their book\n□ TEACH SOCIAL STUDIES LESSON 2A (Warm Up - Focus on Reading) p. 23-27"},
]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_todo(todo_data: dict):
    """할일 생성 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")


@router.get("")
async def get_all_todos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    curriculum_id: Optional[int] = Query(None),
    curri_detail_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    todo_type: Optional[str] = Query(None),
):
    """할일 목록 조회 - 데모 버전"""
    filtered = DEMO_TODOS
    
    if curriculum_id:
        # curriculum_id로는 직접 필터링 불가 (추가 정보 필요)
        pass
    if curri_detail_id:
        filtered = [t for t in filtered if t["curri_detail_id"] == curri_detail_id]
    if subject_id:
        filtered = [t for t in filtered if t["subject_id"] == subject_id]
    if todo_type:
        filtered = [t for t in filtered if t["todo_type"] == todo_type]
    
    return filtered[skip:skip+limit]


@router.get("/{todo_id}")
async def get_todo(todo_id: int):
    """할일 상세 조회 - 데모 버전"""
    todo = next((t for t in DEMO_TODOS if t["todo_id"] == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="할일을 찾을 수 없습니다.")
    return todo


@router.put("/{todo_id}")
async def update_todo(todo_id: int, todo_data: dict):
    """할일 수정 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: int):
    """할일 삭제 - 데모 비활성화"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="데모 버전에서는 지원하지 않습니다.")

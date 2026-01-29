from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional

router = APIRouter()

# ========== 데모용 하드코딩 데이터 (WAVE 커리큘럼 기준) ==========
DEMO_CURRICULUM_DETAILS = [
    # WAVE LANGUAGE ARTS (curriculum_id: 27, subject_id: 2)
    {"curri_detail_id": 1, "curriculum_id": 27, "subject_id": 2, "day": 1, "progress": "READING DAY LESSON 11", "notice": "1. 온라인 학습: 앱 스토어 검색 : MVA > 설치 후 로그인 사용\n2. 발음영상 올리기 ( JOURNEYS 교재 p.14~23)", "homework": "- [MVA-LA11] | ON | 온라인 단어학습 MVA | LA 11", "before_class": "TODAY IS READING DAY. MAKE SURE TO  GO THROUGH JOURNEYS BOOK AS A WHOLE IN CLASS.", "in_class": "□ READING DAY ( JOURNEYS BOOK p.14~29, 34~36 )"},
    {"curri_detail_id": 2, "curriculum_id": 27, "subject_id": 2, "day": 2, "progress": "WAVE LESSON 11 p. 16-21", "notice": "발음영상 올리기 ( JOURNEYS 교재 p.24-29)", "homework": "- [LA11-1] | OFF | LANGUAGE ARTS 교재 : HOMEWORK SECTION | Vocabulary Review p.20-21\n- [LI-11L] | ON | LANGCON ISLAND LA 11 (LISTENING)", "before_class": "□Check Online HW on the HW Checklist\n□Foreign LA teachers only upload COLUMBUS pronunciation video feedback in the comment section once a week in BAND.", "in_class": "□ TEACH: Language Arts Pre-Starter LESSON 11 Warm Up ~ Vocabulary in Context (p.16 ~ 19)\n□ [IMPORTANT] PLEASE TEACH HOMEWORK SECTION IN CLASS."},
    {"curri_detail_id": 3, "curriculum_id": 27, "subject_id": 2, "day": 3, "progress": "WAVE LESSON 11 p. 22-27", "notice": "발음영상 올리기 ( JOURNEYS 교재 p.34~36)", "homework": "- [LA11-2] | OFF | LANGUAGE ARTS 교재 : HOMEWORK SECTION | Grammar Review p.26-27", "before_class": "□Check Online HW on the HW Checklist", "in_class": "□ TEACH: Language Arts Pre-Starter LESSON 11 Grammar Focus ~ Grammar Practice (p.22 ~ 25)\n□ Check Online HW on the HW Checklist & Stamp their HW Calendars in the book"},
    {"curri_detail_id": 4, "curriculum_id": 27, "subject_id": 2, "day": 4, "progress": "WAVE LESSON 11 p. 28-33", "notice": "발음영상 올리기 ( JOURNEYS 교재 p.14~23)", "homework": "- [LA11-3] | OFF | LANGUAGE ARTS 교재 : HOMEWORK SECTION | Test Yourself 1 p.32-33", "before_class": "□Check Online HW on the HW Checklist", "in_class": "□ READ JOURNEY'S LESSON 11 \"At Home in the Ocean\" p.14-23\n□ TEACH: Language Arts Pre-Starter LESSON 11 Comprehension: Text 1 ~ Making Connections 1 (p.28 ~ 31)"},
    {"curri_detail_id": 5, "curriculum_id": 27, "subject_id": 2, "day": 5, "progress": "WAVE LESSON 11 p. 34-39", "notice": "발음영상 올리기 ( JOURNEYS 교재 p.24-29)", "homework": "- [LA11-4] | OFF | LANGUAGE ARTS 교재 : HOMEWORK SECTION | Test Yourself 2 p.38-39", "before_class": "□Check Online HW on the HW Checklist", "in_class": "□ READ JOURNEY'S LESSON 11 \"At Home in the Ocean\" p.24~29\n□ TEACH: Language Arts Pre-Starter LESSON 11 Comprehension: Text 2 ~ Making Connections 2 (p.34 ~ 37)"},
    
    # WAVE SCIENCE (curriculum_id: 28, subject_id: 4)
    {"curri_detail_id": 101, "curriculum_id": 28, "subject_id": 4, "day": 1, "progress": "WAVE SCIENCE LESSON 1 (A)", "notice": "[ 다음 SCIENCE 시간에 단어시험 공지s ]\nLanguage Arts_ Lesson 16 (No. 1~12) VITAMIN p.4", "homework": "- [LI-SC1-V] | ON | LANGCON ISLAND SC1 (VOCA)\n- [MVA-SC1] | ON | 온라인 단어학습 MVA ( VITAMIN ) SC1", "before_class": "[ PRINT ]\n□ Print 첫날 교재 미리 출력", "in_class": "□ Stamp their HW Calendars in their book\n□ TEACH SCIENCE LESSON 1A (Warm UP-Focus on Reading) p. 9-13\n□ DO IN CLASS : LANGCON POWER - Chapter 1A"},
    {"curri_detail_id": 102, "curriculum_id": 28, "subject_id": 4, "day": 2, "progress": "WAVE SCIENCE LESSON 1 (B)", "notice": "[ 오늘의 단어시험 TODAY'S VOCA TEST ]\nLanguage Arts_ Lesson 16 (No. 1~12) VITAMIN p.4", "homework": "- [LI-SC1-R] | ON | LANGCON ISLAND SC1 (READING)", "before_class": "[ PRINT ]VOCA TEST\nLanguage Arts _ Lesson 11 (No. 1~12)\n□ [ CHECK ONLINE HW ] MVA ( VITAMIN 단어 온라인 )", "in_class": "[ IMPORTANT] RUN VOCA TEST & DO LANGCON POWER AND TEXTBOOK HOMEWORK SECTION IN CLASS.\n□Check Textbook/Offline HW & Stamp their HW Calendars in their book\n□TEACH SCIENCE LESSON 1B (Focus on Reading - Present the Ideas ) p. 14-18"},
    {"curri_detail_id": 103, "curriculum_id": 28, "subject_id": 4, "day": 3, "progress": "WAVE SCIENCE LESSON 2 (A)", "notice": "[ 오늘의 단어시험 TODAY'S VOCA TEST ]\nLanguage Arts_ Lesson 16 (No. 13~24) VITAMIN p.5", "homework": "- [LI-SC2-V] | ON | LANGCON ISLAND SC2 (VOCA)\n- [MVA-SC2] | ON | 온라인 단어학습 MVA ( VITAMIN ) SC2", "before_class": "[ PRINT ]VOCA TEST\nLanguage Arts _Lesson 11 (No. 13~24)", "in_class": "[ IMPORTANT] RUN VOCA TEST & DO LANGCON POWER AND TEXTBOOK HOMEWORK SECTION IN CLASS.\n□Check Textbook/Offline HW\n□ Stamp their HW Calendars in their book\n□ TEACH SCIENCE LESSON 2A (Warm UP-Focus on Reading) p.23-27"},
    
    # WAVE SOCIAL STUDIES (curriculum_id: 29, subject_id: 5)
    {"curri_detail_id": 201, "curriculum_id": 29, "subject_id": 5, "day": 1, "progress": "WAVE SOCIAL STUDIES LESSON 1 (A)", "notice": "[ 다음 SOCIAL STUDIES 시간 단어시험 NEXT VOCA TEST ]\nVITAMIN VOCA SOCIAL STUDIES CHAPTER 1 (p.24)", "homework": "- [LI-SS1-V] | ON | LANGCON ISLAND SS1 (VOCA)\n- [MVA-SS1] | ON | 온라인 단어학습 MVA ( VITAMIN ) SS1", "before_class": "[ PRINT ]\n□ Print 첫날 교재 미리 출력", "in_class": "□ TEACH SOCIAL STUDIES LESSON 1A (Warm Up - Focus on Reading) p. 9-13\n□ LANGCON POWER - Chapter 1A"},
    {"curri_detail_id": 202, "curriculum_id": 29, "subject_id": 5, "day": 2, "progress": "WAVE SOCIAL STUDIES LESSON 1 (B)", "notice": "[ 오늘의 단어시험 ]\nVITAMIN VOCA SOCIAL STUDIES CHAPTER 1 (p.24)", "homework": "- [LI-SS1-R] | ON | LANGCON ISLAND SS1 (READING)", "before_class": "[ PRINT ]VOCA TEST\nLanguage Arts _ Lesson 11 (No. 1~12)\n□ [ CHECK ONLINE HW ] MVA ( VITAMIN 단어 온라인 )", "in_class": "[ RUN ] VOCA TEST\n□Check Textbook/Offline HW\n□Stamp their HW Calendars in their book\n□TEACH SOCIAL STUDIES LESSON 1B (Focus on Reading - Present the Ideas) p. 14-18"},
    {"curri_detail_id": 203, "curriculum_id": 29, "subject_id": 5, "day": 3, "progress": "WAVE SOCIAL STUDIES LESSON 2 (A)", "notice": "[ 오늘의 단어시험 ]\nVITAMIN VOCA SCIENCE CHAPTER 1 (p.16)", "homework": "- [LI-SS2-V] | ON | LANGCON ISLAND SS2 (VOCA)\n- [MVA-SS2] | ON | 온라인 단어학습 MVA ( VITAMIN ) SS2", "before_class": "[ PRINT ]VOCA TEST\nLanguage Arts _Lesson 11 (No. 13~24)", "in_class": "[ RUN ] VOCA TEST\n□Check Textbook/Offline HW\n□ Stamp their HW Calendars in their book\n□ TEACH SOCIAL STUDIES LESSON 2A (Warm Up - Focus on Reading) p. 23-27"},
]

# 간단한 조회를 위한 커리큘럼 정보
CURRICULUM_INFO = {
    27: {"curriculum_name": "WAVE", "subject_name": "LANGUAGE ARTS"},
    28: {"curriculum_name": "WAVE", "subject_name": "SCIENCE"},
    29: {"curriculum_name": "WAVE", "subject_name": "SOCIAL STUDIES"}
}

@router.get("")
async def get_curriculum_details(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    curriculum_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None)
):
    """커리큘럼 상세 목록 조회 - 데모 버전"""
    filtered = DEMO_CURRICULUM_DETAILS
    
    if curriculum_id:
        filtered = [d for d in filtered if d["curriculum_id"] == curriculum_id]
    
    if subject_id:
        filtered = [d for d in filtered if d["subject_id"] == subject_id]
    
    return filtered[skip:skip+limit]

@router.get("/{curri_detail_id}")
async def get_curriculum_detail(curri_detail_id: int):
    """커리큘럼 상세 단일 조회 - 데모 버전"""
    detail = next((d for d in DEMO_CURRICULUM_DETAILS if d["curri_detail_id"] == curri_detail_id), None)
    if not detail:
        raise HTTPException(status_code=404, detail="커리큘럼 상세 정보를 찾을 수 없습니다.")
    return detail
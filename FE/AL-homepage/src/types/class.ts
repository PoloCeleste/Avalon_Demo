export interface ScheduleDetail {
  weekday: string // "Mon", "Tue", etc.
  subject_id?: number
  classtime_id?: number
  // [수정] teacher_id가 null 값도 가질 수 있도록 허용
  teacher_id?: number | null
}

export interface ClassItem {
  semester_id: number
  curriculum_id: number
  class_name: string
  attend_day: string // "Mon/Wed/Fri"
  kr_homeroom_id: number
  fr_homeroom_id: number
  is_active: boolean
  class_id: number
  created_at?: string
  schedule_details_json?: ScheduleDetail[]
}

export interface StudentClassInfo extends ClassItem {
  subject_name: string
  teacher_name: string
  schedule: {
    day_of_week: number
    start_time: string
    end_time: string
  }
}

// ClassDetail.tsx의 mappedSessions 로직과 일치하도록 재정의
export interface ClassSession extends ScheduleDetail {
  session_id: number
  session_date: string // YYYY-MM-DD 형식
  class_id: number
  class_name?: string
  subject_name?: string
  teacher_id: number | null
  curri_detail_id: number
  session_order: number
  is_rescheduled: boolean
  original_date: string | null
  notes: string | null
}

export interface CreateClassRequest {
  semester_id: number
  curriculum_id: number
  class_name: string
  attend_day: string
  kr_homeroom_id: number
  fr_homeroom_id: number
  is_active: boolean
  schedule_details_json: ScheduleDetail[]
}

export interface UpdateClassRequest {
  semester_id?: number
  curriculum_id?: number
  class_name?: string
  attend_day?: string
  kr_homeroom_id?: number
  fr_homeroom_id?: number
  is_active?: boolean
  schedule_details_json?: ScheduleDetail[] // API 명세에 따라 추가
}

export interface GetAllClassesParams {
  skip?: number
  limit?: number
  semester_id?: number
  curriculum_id?: number
  is_active?: boolean
}

export interface GetAllClassSessionsParams {
  skip?: number
  limit?: number
  class_id?: number
  subject_id?: number
  teacher_id?: number
  session_date?: string
  weekday?: string
  semester_id?: number // semester_id 추가
}

// 반 숙제 마감일 목록 조회 API(13.6)의 응답 타입을 위한 인터페이스 추가
export interface HomeworkDueDate {
  homework_id: number
  tag_name: string
  subject_name: string
  assigned_date: string
  due_date: string
}

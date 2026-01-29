export type StudentStatus = 'ACTIVE' | 'ON_LEAVE' | 'WITHDRAWN' | 'DELETED'

export interface Student {
  student_name: string
  branch_id: number
  english_name: string
  student_phone: string
  parent_phone: string
  school: string
  s_year: number
  birthday: string // YYYY-MM-DD
  status: StudentStatus
  student_id: number
  created_at: string // ISO 8601 date string
  updated_at: string | null // ISO 8601 date string or null
  deleted_at: string | null // ISO 8601 date string or null
}

export interface CreateStudentRequest {
  student_name: string
  branch_id: number
  english_name?: string
  student_phone?: string
  parent_phone: string
  school?: string
  s_year: number
  birthday?: string
  status: StudentStatus
}

export interface UpdateStudentRequest {
  english_name?: string
  student_phone?: string
  parent_phone?: string
  school?: string
  s_year?: number
  birthday?: string
  status?: StudentStatus
}

export interface GetAllStudentsParams {
  skip?: number
  limit?: number
  branch_id?: number
  status?: StudentStatus
}
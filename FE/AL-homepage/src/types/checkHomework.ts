export interface CheckHomework {
  student_id: number
  homework_id: number
  class_id: number
  checker_id: number
  check_homework_id: number
  created_at: string // ISO 8601 date string
  updated_at: string | null // ISO 8601 date string or null
}

export interface CreateCheckHomeworkRequest {
  student_id: number
  homework_id: number
  class_id: number
  checker_id: number
}

export interface GetAllCheckHomeworksParams {
  student_id?: number
  homework_id?: number
  class_id?: number
}

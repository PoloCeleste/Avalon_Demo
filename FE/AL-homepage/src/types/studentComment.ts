export interface StudentComment {
  comment_id: number
  student_id: number
  comment: string
  comment_user_id: number
  created_at: string // ISO 8601 date string
}

export interface CreateStudentCommentRequest {
  student_id: number
  comment: string
  comment_user_id: number
}

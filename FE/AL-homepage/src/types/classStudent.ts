export interface ClassStudent {
  class_id: number
  student_id: number
  belong_id: number
}

export interface AssignStudentsToClassRequest {
  student_ids: number[] // Array of student IDs
}

export interface GetClassStudentsParams {
  skip?: number
  limit?: number
}

export interface GetStudentClassesParams {
  skip?: number
  limit?: number
  semester_id?: number
}

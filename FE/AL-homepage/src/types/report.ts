export interface ClassHomeworkProgressReport {
  class_id: number
  reports: {
    student_id: number
    student_name: string
    total_homework: number
    completed_homework: number
    completion_rate: number
  }[]
}

export interface GetClassHomeworkProgressReportParams {
  start_date?: string
  end_date?: string
}

export interface StudentWeeklyHomeworkDetail {
  homework_id: number
  homework_name: string
  subject_name: string
  assigned_date: string
  due_date: string
  status: string
}

export interface StudentWeeklyHomeworkReport {
  student_id: number
  student_name: string
  start_of_week: string
  end_of_week: string
  total_homework_count: number
  completed_homework_count: number
  completion_rate: number
  homeworks: StudentWeeklyHomeworkDetail[]
}

export interface ClassPerformanceDetail {
  class_id: number
  class_name: string
  completion_rate: number
  students_below_70_percent: number
}

export interface TeacherClassPerformanceReport {
  user_id: number
  user_name: string
  semester_id: number
  semester_name: string
  overall_completion_rate: number
  classes_below_70_percent: number
  total_students_below_70_percent: number
  class_details: ClassPerformanceDetail[]
}

export interface SubjectPerformanceDetail {
  subject_id: number
  subject_name: string
  completion_rate: number
  students_below_70_percent: number
}

export interface TeacherSubjectPerformanceReport {
  user_id: number
  user_name: string
  semester_id: number
  semester_name: string
  overall_completion_rate: number
  subjects_below_70_percent: number
  total_students_below_70_percent: number
  subject_details: SubjectPerformanceDetail[]
}

export interface LowPerformanceStudent {
  rank: number
  student_id: number
  student_name: string
  homeroom_teacher: string
  class_name: string
  overall_completion_rate: number
}

export interface LowPerformanceSubjectStudent {
  rank: number
  student_id: number
  student_name: string
  homeroom_teacher: string
  subject_name: string
  subject_completion_rate: number
}

export interface StudentSubjectProgressReport {
  class_id: number
  subject_id: number
  subject_name: string
  teacher_name: string
  subject_total: number
  subject_completed: number
  completion_rate: number
}

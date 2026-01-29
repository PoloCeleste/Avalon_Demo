export interface Consultation {
  consultation_id: number
  student_id: number
  semester_id: number
  consultant_id: number
  consultation_name: string
  consultation_detail: string
  is_deleted: boolean
  created_at: string // ISO 8601 date string
  updated_at: string | null // ISO 8601 date string or null
}

export interface CreateConsultationRequest {
  student_id: number
  semester_id: number
  consultant_id: number
  consultation_name: string
  consultation_detail: string
}

export interface UpdateConsultationRequest {
  consultation_name?: string
  consultation_detail?: string
}

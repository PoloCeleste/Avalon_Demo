export interface Subject {
  subject_name: string
  subject_nick: string
  subject_id: number
}

export interface CreateSubjectRequest {
  subject_name: string
  subject_nick: string
}

export interface UpdateSubjectRequest {
  subject_name?: string
  subject_nick?: string
}

export interface GetAllSubjectsParams {
  skip?: number
  limit?: number
}

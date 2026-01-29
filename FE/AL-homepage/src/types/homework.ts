export interface Homework {
  curri_detail_id: number
  subject_id: number
  tag_name: string
  is_online: boolean
  homework_name: string
  homework_contents: string
  homework_id: number
  curriculum_id?: number
}

export interface CreateHomeworkRequest {
  curri_detail_id: number
  subject_id: number
  tag_name: string
  is_online: boolean
  homework_name: string
  homework_contents: string
}

export interface UpdateHomeworkRequest {
  curri_detail_id?: number
  subject_id?: number
  tag_name?: string
  is_online?: boolean
  homework_name?: string
  homework_contents?: string
}

export interface GetAllHomeworksParams {
  skip?: number
  limit?: number
  curriculum_id?: number
  curri_detail_id?: number
  subject_id?: number
}

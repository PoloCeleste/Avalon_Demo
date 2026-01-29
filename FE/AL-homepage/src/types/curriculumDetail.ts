import type { Todo } from './todo'
import type { Homework } from './homework'

export interface CurriculumDetail {
  curriculum_id: number
  subject_id: number
  day: number
  progress: string
  curri_detail_id: number
  notice?: string
  homework?: string
  before_class?: string
  in_class?: string
  todos?: Todo[]
  homeworks?: Homework[]
}

export interface CreateCurriculumDetailRequest {
  curriculum_id: number
  subject_id: number
  day: number
  progress: string
}

export interface UpdateCurriculumDetailRequest {
  curriculum_id?: number
  subject_id?: number
  day?: number
  progress?: string
}

export interface GetAllCurriculumDetailsParams {
  skip?: number
  limit?: number
  curriculum_id?: number
  subject_id?: number
}

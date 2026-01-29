export type CurriculumType = 'langcon' | 'avalon' | 'special' | 'vacation'

export interface Curriculum {
  curriculum_id: number
  curriculum_name: string
  type: CurriculumType
  created_at: string
  deleted_at: string | null
  used_class_count?: number
}

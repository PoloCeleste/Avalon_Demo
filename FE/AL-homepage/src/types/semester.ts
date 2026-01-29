// src/types/semester.ts
export const SemesterStatus = {
  Upcoming: 0,
  InProgress: 1,
  Completed: 2,
} as const

export type SemesterStatus = (typeof SemesterStatus)[keyof typeof SemesterStatus]

export interface Semester {
  semester_id: number
  branch_id: number
  semester_name: string
  semester_start_at: string // Format: YYYY-MM-DD
  semester_end_at: string // Format: YYYY-MM-DD
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter'
  status: SemesterStatus
}

export interface UpdateSemesterRequest {
  branch_id?: number
  semester_name?: string
  semester_start_at?: string
  semester_end_at?: string
  season?: Semester['season']
  status?: SemesterStatus
}

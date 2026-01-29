import instance from './axiosInstance'
import { type Semester, type UpdateSemesterRequest, SemesterStatus } from '../types/semester'

// 학기 생성
export const createSemester = async (semesterData: {
  branch_id: number
  semester_name: string
  semester_start_at: string
  semester_end_at: string
  season: Semester['season']
}): Promise<Semester> => {
  const response = await instance.post('/api/semesters/', semesterData)
  return response.data
}

// 모든 학기 조회
export const getAllSemesters = async (params?: {
  skip?: number
  limit?: number
  branch_id?: number
  status?: SemesterStatus
}): Promise<Semester[]> => {
  const response = await instance.get('/api/semesters/', { params })
  return response.data
}

// ID로 학기 조회
export const getSemesterById = async (semester_id: number): Promise<Semester> => {
  const response = await instance.get(`/api/semesters/${semester_id}`)
  return response.data
}

// 학기 정보 수정
export const updateSemester = async (
  semester_id: number,
  semesterData: UpdateSemesterRequest,
): Promise<Semester> => {
  const response = await instance.put(`/api/semesters/${semester_id}`, semesterData)
  return response.data
}

// 학기 삭제
export const deleteSemester = async (semester_id: number): Promise<void> => {
  await instance.delete(`/api/semesters/${semester_id}`)
}

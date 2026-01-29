import instance from './axiosInstance'
import type {
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  GetAllSubjectsParams,
} from '../types/subject'

// 과목 생성
export const createSubject = async (subjectData: CreateSubjectRequest): Promise<Subject> => {
  const response = await instance.post('/api/subjects/', subjectData)
  return response.data
}

// 모든 과목 조회
export const getAllSubjects = async (params?: GetAllSubjectsParams): Promise<Subject[]> => {
  const response = await instance.get('/api/subjects/', { params })
  return response.data
}

// ID로 과목 조회
export const getSubjectById = async (subject_id: number): Promise<Subject> => {
  const response = await instance.get(`/api/subjects/${subject_id}`)
  return response.data
}

// 과목 정보 수정
export const updateSubject = async (
  subject_id: number,
  subjectData: UpdateSubjectRequest,
): Promise<Subject> => {
  const response = await instance.put(`/api/subjects/${subject_id}`, subjectData)
  return response.data
}

// 과목 삭제
export const deleteSubject = async (subject_id: number): Promise<void> => {
  await instance.delete(`/api/subjects/${subject_id}`)
}

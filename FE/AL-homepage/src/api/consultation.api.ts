import instance from './axiosInstance'
import type {
  Consultation,
  CreateConsultationRequest,
  UpdateConsultationRequest,
} from '../types/consultation'

// 상담 기록 생성
export const createConsultation = async (
  consultationData: CreateConsultationRequest,
): Promise<Consultation> => {
  const response = await instance.post('/api/consultations/', consultationData)
  return response.data
}

// 특정 상담 기록 조회
export const getConsultationById = async (consultation_id: number): Promise<Consultation> => {
  const response = await instance.get(`/api/consultations/${consultation_id}`)
  return response.data
}

// 특정 학생의 모든 상담 기록 조회
export const getConsultationsByStudentId = async (student_id: number): Promise<Consultation[]> => {
  const response = await instance.get(`/api/consultations/student/${student_id}`)
  return response.data
}

// 상담 기록 수정
export const updateConsultation = async (
  consultation_id: number,
  consultationData: UpdateConsultationRequest,
): Promise<Consultation> => {
  const response = await instance.put(`/api/consultations/${consultation_id}`, consultationData)
  return response.data
}

// 상담 기록 삭제 (논리적 삭제)
export const deleteConsultation = async (consultation_id: number): Promise<Consultation> => {
  const response = await instance.delete(`/api/consultations/${consultation_id}`)
  return response.data
}

// 학기별 상담 기록 조회
export const getConsultationsBySemesterId = async (
  semester_id: number,
): Promise<Consultation[]> => {
  const response = await instance.get(`/api/consultations/semester/${semester_id}`)
  return response.data
}

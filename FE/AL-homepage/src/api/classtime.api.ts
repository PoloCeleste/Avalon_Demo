import instance from './axiosInstance'
import type {
  Classtime,
  CreateClasstimeRequest,
  UpdateClasstimeRequest,
  GetAllClasstimesParams,
} from '../types/classtime'

// 수업 시간 생성
export const createClasstime = async (
  classtimeData: CreateClasstimeRequest,
): Promise<Classtime> => {
  const response = await instance.post('/api/classtimes/', classtimeData)
  return response.data
}

// 모든 수업 시간 조회
export const getAllClasstimes = async (params?: GetAllClasstimesParams): Promise<Classtime[]> => {
  const response = await instance.get('/api/classtimes/', { params })
  return response.data
}

// ID로 수업 시간 조회
export const getClasstimeById = async (time_id: number): Promise<Classtime> => {
  const response = await instance.get(`/api/classtimes/${time_id}`)
  return response.data
}

// 수업 시간 정보 수정
export const updateClasstime = async (
  time_id: number,
  classtimeData: UpdateClasstimeRequest,
): Promise<Classtime> => {
  const response = await instance.put(`/api/classtimes/${time_id}`, classtimeData)
  return response.data
}

// 수업 시간 삭제
export const deleteClasstime = async (time_id: number): Promise<void> => {
  await instance.delete(`/api/classtimes/${time_id}`)
}

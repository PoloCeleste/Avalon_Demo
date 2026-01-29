import instance from './axiosInstance'
import type {
  CheckHomework,
  CreateCheckHomeworkRequest,
  GetAllCheckHomeworksParams,
} from '../types/checkHomework'

// 숙제 확인 기록 생성
export const createCheckHomework = async (
  checkHomeworkData: CreateCheckHomeworkRequest,
): Promise<CheckHomework> => {
  const response = await instance.post('/api/check_homeworks/', checkHomeworkData)
  return response.data
}

// 숙제 확인 기록 조회
export const getAllCheckHomeworks = async (
  params?: GetAllCheckHomeworksParams,
): Promise<CheckHomework[]> => {
  const response = await instance.get('/api/check_homeworks/', { params })
  return response.data
}

// 숙제 확인 기록 삭제
export const deleteCheckHomework = async (
  check_homework_id: number,
  class_id?: number,
): Promise<void> => {
  const params = class_id ? { class_id } : {}
  await instance.delete(`/api/check_homeworks/${check_homework_id}`, { params })
}

// ✨ [추가] 숙제 일괄 체크 등록
export const checkAllHomeworks = async (params: {
  class_id: number
  subject_id: number
  homework_id: number
}): Promise<CheckHomework[]> => {
  const response = await instance.post('/api/check_homeworks/all', null, { params })
  return response.data
}

// ✨ [추가] 숙제 일괄 체크 해제
export const uncheckAllHomeworks = async (params: {
  class_id: number
  subject_id: number
  homework_id: number
}): Promise<number> => {
  const response = await instance.delete('/api/check_homeworks/all', { params })
  return response.data
}

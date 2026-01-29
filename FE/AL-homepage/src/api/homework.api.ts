import instance from './axiosInstance'
import type {
  Homework,
  CreateHomeworkRequest,
  UpdateHomeworkRequest,
  GetAllHomeworksParams,
} from '../types/homework'

// 숙제 생성
export const createHomework = async (homeworkData: CreateHomeworkRequest): Promise<Homework> => {
  const response = await instance.post('/api/homeworks/', homeworkData)
  return response.data
}

// 모든 숙제 조회
export const getAllHomeworks = async (params?: GetAllHomeworksParams): Promise<Homework[]> => {
  const response = await instance.get('/api/homeworks/', { params })
  return response.data
}

// ID로 숙제 조회
export const getHomeworkById = async (homework_id: number): Promise<Homework> => {
  const response = await instance.get(`/api/homeworks/${homework_id}`)
  return response.data
}

// 숙제 정보 수정
export const updateHomework = async (
  homework_id: number,
  homeworkData: UpdateHomeworkRequest,
): Promise<Homework> => {
  const response = await instance.put(`/api/homeworks/${homework_id}`, homeworkData)
  return response.data
}

// 숙제 삭제
export const deleteHomework = async (homework_id: number): Promise<void> => {
  await instance.delete(`/api/homeworks/${homework_id}`)
}
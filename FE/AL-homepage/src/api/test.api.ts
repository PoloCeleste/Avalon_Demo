import instance from './axiosInstance'
import type { Test, CreateTestRequest, UpdateTestRequest, GetAllTestsParams } from '../types/test'

// 16.1 시험 생성
export const createTest = async (testData: CreateTestRequest): Promise<Test> => {
  const response = await instance.post('/api/tests/', testData)
  return response.data
}

// 16.5 시험 대량 생성 (추가된 함수)
export const createBulkTests = async (testsData: CreateTestRequest[]): Promise<Test[]> => {
  const response = await instance.post('/api/tests/bulk', testsData)
  return response.data
}

// 16.2 모든 시험 조회
export const getAllTests = async (params?: GetAllTestsParams): Promise<Test[]> => {
  const response = await instance.get('/api/tests/', { params })
  return response.data
}

// 16.3 ID로 시험 조회
export const getTestById = async (test_id: number): Promise<Test> => {
  const response = await instance.get(`/api/tests/${test_id}`)
  return response.data
}

// 16.4 시험 정보 수정
export const updateTest = async (test_id: number, testData: UpdateTestRequest): Promise<Test> => {
  const response = await instance.put(`/api/tests/${test_id}`, testData)
  return response.data
}

// 16.6 시험 삭제 (추가된 함수)
export const deleteTest = async (test_id: number): Promise<void> => {
  await instance.delete(`/api/tests/${test_id}`)
}

import instance from './axiosInstance'
import type {
  TestResult,
  CreateTestResultRequest,
  UpdateTestResultRequest,
  GetAllTestResultsParams,
} from '../types/testResult'

// 시험 결과 생성
export const createTestResult = async (
  testResultData: CreateTestResultRequest,
): Promise<TestResult> => {
  const response = await instance.post('/api/test_results/', testResultData)
  return response.data
}

// 모든 시험 결과 조회
export const getAllTestResults = async (
  params?: GetAllTestResultsParams,
): Promise<TestResult[]> => {
  const response = await instance.get('/api/test_results/', { params })
  return response.data
}

// ID로 시험 결과 조회
export const getTestResultById = async (result_id: number): Promise<TestResult> => {
  const response = await instance.get(`/api/test_results/${result_id}`)
  return response.data
}

// 시험 결과 정보 수정
export const updateTestResult = async (
  result_id: number,
  testResultData: UpdateTestResultRequest,
): Promise<TestResult> => {
  const response = await instance.put(`/api/test_results/${result_id}`, testResultData)
  return response.data
}

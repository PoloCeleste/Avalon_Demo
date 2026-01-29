export interface TestResult {
  test_id: number
  student_id: number
  score: number
  result_id: number
}

export interface CreateTestResultRequest {
  test_id: number
  student_id: number
  score: number
}

export interface UpdateTestResultRequest {
  test_id?: number
  student_id?: number
  score?: number
}

export interface GetAllTestResultsParams {
  skip?: number
  limit?: number
  test_id?: number
  student_id?: number
}

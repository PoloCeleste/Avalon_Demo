export interface Test {
  class_id: number
  subject_id: number
  test_title: string
  test_day: string // YYYY-MM-DD
  test_id: number
}

export interface CreateTestRequest {
  class_id: number
  subject_id: number
  test_title: string
  test_day: string // YYYY-MM-DD
}

export interface UpdateTestRequest {
  class_id?: number
  subject_id?: number
  test_title?: string
  test_day?: string // YYYY-MM-DD
}

export interface GetAllTestsParams {
  skip?: number
  limit?: number
  class_id?: number
  subject_id?: number
}

// 클래스 세션 생성 API 요청 본문을 위한 새 인터페이스 추가
export interface TestSchedule extends CreateTestRequest {
  classtime_ids: number[]
}

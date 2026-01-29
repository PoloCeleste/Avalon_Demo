// class.api.ts
import instance from './axiosInstance'
import type {
  ClassItem,
  CreateClassRequest,
  UpdateClassRequest,
  GetAllClassesParams,
  HomeworkDueDate,
  ClassSession,
  GetAllClassSessionsParams,
} from '../types/class'
import type { TestSchedule } from '../types/test'

// 모든 반 목록 조회
export async function getAllClasses(params?: GetAllClassesParams): Promise<ClassItem[]> {
  const res = await instance.get<ClassItem[]>('/api/classes/', { params })
  return res.data
}

// ID로 반 조회
export async function getClassById(class_id: number): Promise<ClassItem> {
  const res = await instance.get<ClassItem>(`/api/classes/${class_id}`)
  return res.data
}

// 반 생성 (13.1)
export async function createClass(payload: CreateClassRequest): Promise<ClassItem> {
  const res = await instance.post<ClassItem>('/api/classes/', payload)
  return res.data
}

// 반 정보 수정 (13.5)
export async function updateClass(
  class_id: number,
  payload: UpdateClassRequest,
): Promise<ClassItem> {
  const res = await instance.put<ClassItem>(`/api/classes/${class_id}`, payload)
  return res.data
}

// 반 삭제
export async function deleteClass(class_id: number): Promise<void> {
  await instance.delete(`/api/classes/${class_id}`)
}

// 클래스 세션 생성 (13.2)
export async function generateClassSessions(
  class_id: number,
  test_schedules: TestSchedule[],
): Promise<{ message: string }> {
  const res = await instance.post(`/api/classes/${class_id}/generate-sessions`, { test_schedules })
  return res.data
}

// 모든 수업 세션 조회 (14.3)
export async function getClassSessions(
  params?: GetAllClassSessionsParams,
): Promise<ClassSession[]> {
  const res = await instance.get<ClassSession[]>('/api/class_sessions/', { params })
  return res.data
}

// 반 숙제 마감일 목록 조회 (13.6)
export async function getClassHomeworkDueDates(
  class_id: number,
  due_date?: string,
): Promise<HomeworkDueDate[]> {
  const params = due_date ? { due_date } : {}
  const res = await instance.get<HomeworkDueDate[]>(`/api/classes/${class_id}/homework-due-dates`, {
    params,
  })
  return res.data
}

import instance from './axiosInstance'
import type {
  ClassStudent,
  GetClassStudentsParams,
  GetStudentClassesParams,
} from '../types/classStudent'
import type { Student } from '../types/student' // Assuming Student type is needed for class students
import type { StudentClassInfo } from '../types/class' // Changed from Class to ClassItem

// 학생을 반에 할당
export const assignStudentsToClass = async (
  class_id: number,
  student_ids: number[],
): Promise<ClassStudent[]> => {
  const response = await instance.post(`/api/classes/${class_id}/students`, student_ids)
  return response.data
}

// 반에서 학생 제거
export const removeStudentFromClass = async (
  class_id: number,
  student_id: number,
): Promise<void> => {
  await instance.delete(`/api/classes/${class_id}/students/${student_id}`)
}

// 특정 반의 학생 목록 조회
export const getStudentsInClass = async (
  class_id: number,
  params?: GetClassStudentsParams,
): Promise<Student[]> => {
  const response = await instance.get(`/api/classes/${class_id}/students`, { params })
  return response.data
}

// 특정 학생이 할당된 반 목록 조회
export const getClassesForStudent = async (
  student_id: number,
  params?: GetStudentClassesParams,
): Promise<StudentClassInfo[]> => {
  // Changed return type to ClassItem[]
  const response = await instance.get(`/api/students/${student_id}/classes`, { params })
  return response.data
}
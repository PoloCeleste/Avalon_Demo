import instance from './axiosInstance'
import type {
  Student,
  CreateStudentRequest,
  UpdateStudentRequest,
  GetAllStudentsParams,
} from '../types/student'

// 학생 생성
export const createStudent = async (studentData: CreateStudentRequest): Promise<Student> => {
  const response = await instance.post('/api/students/', studentData)
  return response.data
}

// 모든 학생 조회
export const getAllStudents = async (params?: GetAllStudentsParams): Promise<Student[]> => {
  const requestParams = { limit: 500, ...params }
  const response = await instance.get('/api/students/', { params: requestParams })
  return response.data
}

// ID로 학생 조회
export const getStudentById = async (student_id: number): Promise<Student> => {
  const response = await instance.get(`/api/students/${student_id}`)
  return response.data
}

// 학생 정보 수정
export const updateStudent = async (
  student_id: number,
  studentData: UpdateStudentRequest,
): Promise<Student> => {
  const response = await instance.put(`/api/students/${student_id}`, studentData)
  return response.data
}

// 학생 삭제
export const deleteStudent = async (student_id: number): Promise<void> => {
  await instance.delete(`/api/students/${student_id}`)
}

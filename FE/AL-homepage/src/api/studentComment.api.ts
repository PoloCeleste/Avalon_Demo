import instance from './axiosInstance'
import type { StudentComment, CreateStudentCommentRequest } from '../types/studentComment'

// 학생 메모 생성
export const createStudentComment = async (
  commentData: CreateStudentCommentRequest,
): Promise<StudentComment> => {
  const response = await instance.post('/api/student_comments/', commentData)
  return response.data
}

// 특정 학생의 모든 메모 조회
export const getStudentCommentsByStudentId = async (
  student_id: number,
): Promise<StudentComment[]> => {
  const response = await instance.get(`/api/student_comments/student/${student_id}`)
  return response.data
}

// 학생 메모 삭제
export const deleteStudentComment = async (comment_id: number): Promise<StudentComment> => {
  const response = await instance.delete(`/api/student_comments/${comment_id}`)
  return response.data
}

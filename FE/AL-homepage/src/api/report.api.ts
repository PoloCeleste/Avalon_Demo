import instance from './axiosInstance'
import type {
  ClassHomeworkProgressReport,
  GetClassHomeworkProgressReportParams,
  StudentWeeklyHomeworkReport,
  TeacherClassPerformanceReport,
  TeacherSubjectPerformanceReport,
  LowPerformanceStudent,
  LowPerformanceSubjectStudent,
  StudentSubjectProgressReport,
} from '../types/report'

// 21.1. 반 숙제 진척도 리포트 조회
export const getClassHomeworkProgressReport = async (
  class_id: number,
  params?: GetClassHomeworkProgressReportParams,
): Promise<ClassHomeworkProgressReport> => {
  const response = await instance.get(`/api/reports/class/${class_id}/homework-progress`, {
    params,
  })
  return response.data
}

// 21.2. 반 시간표 PDF 생성
export async function getClassTimetablePdf(
  class_id: number,
  format: 'p' | 'l' | 'l2' = 'l',
): Promise<Blob> {
  const response = await instance.get(`/api/reports/classes/${class_id}/timetable.pdf`, {
    params: { format },
    responseType: 'blob',
  })
  return response.data
}

// 21.3. 학생 주간 숙제 상세 내역 조회
export async function getStudentWeeklyHomeworkDetails(
  student_id: number,
): Promise<StudentWeeklyHomeworkReport> {
  const response = await instance.get(`/api/reports/students/${student_id}/weekly-homework-details`)
  return response.data
}

// 21.4. 강사별 학기별 반 숙제 성취도 통계
export async function getTeacherClassPerformance(
  user_id: number,
  semester_id: number,
): Promise<TeacherClassPerformanceReport> {
  const response = await instance.get(
    `/api/reports/teachers/${user_id}/semesters/${semester_id}/class-performance`,
  )
  return response.data
}

// 21.5. 강사별 학기별 과목 숙제 성취도 통계
export async function getTeacherSubjectPerformance(
  user_id: number,
  semester_id: number,
): Promise<TeacherSubjectPerformanceReport> {
  const response = await instance.get(
    `/api/reports/teachers/${user_id}/semesters/${semester_id}/subject-performance`,
  )
  return response.data
}

// 21.6. 통합 숙제 성취도 하위 10명 조회
export async function getLowPerformanceStudents(
  semester_id: number,
  limit?: number,
): Promise<LowPerformanceStudent[]> {
  const response = await instance.get(`/api/reports/dashboard/low-performance-students`, {
    params: { semester_id, limit },
  })
  return response.data
}

// 21.7. 과목별 숙제 성취도 하위 10명 조회
export async function getLowPerformanceSubjectStudents(
  semester_id: number,
  limit?: number,
): Promise<LowPerformanceSubjectStudent[]> {
  const response = await instance.get(`/api/reports/dashboard/low-performance-subject-students`, {
    params: { semester_id, limit },
  })
  return response.data
}

// 21.8. 학생 개별 반/과목별 숙제 진척도 리포트 조회
export const getStudentSubjectProgress = async (
  student_id: number,
): Promise<StudentSubjectProgressReport[]> => {
  // StudentSubjectProgressReport 타입은 types/report.ts에 추가 필요
  const response = await instance.get(`/api/reports/students/${student_id}/subject-progress`)
  return response.data
}

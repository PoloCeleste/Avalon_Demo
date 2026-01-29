// src/api/curriculum.api.ts
import instance from './axiosInstance'
import type { Curriculum, CurriculumType } from '../types/curriculum'

interface GetAllCurriculumsParams {
  skip?: number
  limit?: number
}

// 8.1. 커리큘럼 생성
export async function createCurriculum(
  curriculum_name: string,
  type: CurriculumType,
): Promise<Curriculum> {
  const res = await instance.post<Curriculum>('/api/curriculums', { curriculum_name, type })
  return res.data
}

// 8.2. CSV로 커리큘럼 일괄 생성
export async function uploadCurriculumCsv(
  file: File,
  type?: CurriculumType,
  curriculum_name?: string,
): Promise<{ message: string }> {
  const formData = new FormData()
  formData.append('file', file)
  if (type) {
    formData.append('type', type)
  }
  if (curriculum_name) {
    formData.append('curriculum_name', curriculum_name)
  }

  const res = await instance.post<{ message: string }>('/api/curriculums/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

// 8.3. 모든 커리큘럼 조회
export async function getAllCurriculums(skip?: number, limit?: number): Promise<Curriculum[]> {
  const params: GetAllCurriculumsParams = {}
  if (skip !== undefined) params.skip = skip
  if (limit !== undefined) params.limit = limit

  const res = await instance.get<Curriculum[]>('/api/curriculums', { params })
  return res.data
}

// 8.4. ID로 커리큘럼 조회
export async function getCurriculumById(curriculum_id: number): Promise<Curriculum> {
  const res = await instance.get<Curriculum>(`/api/curriculums/${curriculum_id}`)
  return res.data
}

// 8.5. 커리큘럼 정보 수정
export async function updateCurriculum(
  curriculum_id: number,
  curriculum_name: string,
): Promise<Curriculum> {
  const res = await instance.put<Curriculum>(`/api/curriculums/${curriculum_id}`, {
    curriculum_name,
  })
  return res.data
}

// 8.6. 커리큘럼 삭제
export async function deleteCurriculum(curriculum_id: number): Promise<void> {
  await instance.delete(`/api/curriculums/${curriculum_id}`)
}

// 8.7. 커리큘럼 소프트 딜리트
export async function softDeleteCurriculum(curriculum_id: number): Promise<{ detail: string }> {
  const res = await instance.post<{ detail: string }>(
    `/api/curriculums/${curriculum_id}/soft_delete`,
  )
  return res.data
}

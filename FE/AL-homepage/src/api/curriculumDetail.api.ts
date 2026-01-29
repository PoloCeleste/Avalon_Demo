import instance from './axiosInstance'
import type {
  CurriculumDetail,
  CreateCurriculumDetailRequest,
  UpdateCurriculumDetailRequest,
  GetAllCurriculumDetailsParams,
} from '../types/curriculumDetail'

// 커리큘럼 상세 생성
export const createCurriculumDetail = async (
  curriculumDetailData: CreateCurriculumDetailRequest,
): Promise<CurriculumDetail> => {
  const response = await instance.post('/api/curriculum_details/', curriculumDetailData)
  return response.data
}

// 모든 커리큘럼 상세 조회
export const getAllCurriculumDetails = async (
  params?: GetAllCurriculumDetailsParams,
): Promise<CurriculumDetail[]> => {
  const response = await instance.get('/api/curriculum_details/', { params })
  return response.data
}

// ID로 커리큘럼 상세 조회
export const getCurriculumDetailById = async (
  curri_detail_id: number,
): Promise<CurriculumDetail> => {
  const response = await instance.get(`/api/curriculum_details/${curri_detail_id}`)
  return response.data
}

// 커리큘럼 상세 정보 수정
export const updateCurriculumDetail = async (
  curri_detail_id: number,
  curriculumDetailData: UpdateCurriculumDetailRequest,
): Promise<CurriculumDetail> => {
  const response = await instance.put(
    `/api/curriculum_details/${curri_detail_id}`,
    curriculumDetailData,
  )
  return response.data
}

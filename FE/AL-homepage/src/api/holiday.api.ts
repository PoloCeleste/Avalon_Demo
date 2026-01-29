import instance from './axiosInstance'
import type {
  Holiday,
  CreateHolidayRequest,
  UpdateHolidayRequest,
  GetAllHolidaysParams,
} from '../types/holiday'

// 휴일 생성
export const createHoliday = async (holidayData: CreateHolidayRequest): Promise<Holiday> => {
  const response = await instance.post('/api/holidays/', holidayData)
  return response.data
}

// 모든 휴일 조회
export const getAllHolidays = async (params?: GetAllHolidaysParams): Promise<Holiday[]> => {
  const response = await instance.get('/api/holidays/', { params })
  return response.data
}

// ID로 휴일 조회
export const getHolidayById = async (holiday_id: number): Promise<Holiday> => {
  const response = await instance.get(`/api/holidays/${holiday_id}`)
  return response.data
}

// 휴일 정보 수정
export const updateHoliday = async (
  holiday_id: number,
  holidayData: UpdateHolidayRequest,
): Promise<Holiday> => {
  const response = await instance.put(`/api/holidays/${holiday_id}`, holidayData)
  return response.data
}

// 휴일 삭제
export const deleteHoliday = async (holiday_id: number): Promise<void> => {
  await instance.delete(`/api/holidays/${holiday_id}`)
}

export interface Holiday {
  holiday_name: string
  holiday_date: string // YYYY-MM-DD
  holiday_id: number
}

export interface CreateHolidayRequest {
  holiday_name: string
  holiday_date: string // YYYY-MM-DD
}

export interface UpdateHolidayRequest {
  holiday_name?: string
  holiday_date?: string // YYYY-MM-DD
}

export interface GetAllHolidaysParams {
  skip?: number
  limit?: number
}

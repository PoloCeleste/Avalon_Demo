export interface Classtime {
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  time_id: number
}

export interface CreateClasstimeRequest {
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
}

export interface UpdateClasstimeRequest {
  start_time?: string // HH:MM:SS
  end_time?: string // HH:MM:SS
}

export interface GetAllClasstimesParams {
  skip?: number
  limit?: number
}

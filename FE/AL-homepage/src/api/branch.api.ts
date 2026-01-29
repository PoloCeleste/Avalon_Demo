// src/api/branch.api.ts
import instance from './axiosInstance'

export interface Branch {
  branch_id: number
  branch_name: string
  branch_phone: string
  branch_address: string
}

export const getAllBranches = async (): Promise<Branch[]> => {
  const response = await instance.get('/api/branches/')
  return response.data
}

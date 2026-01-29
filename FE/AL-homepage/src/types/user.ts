import type { Role } from '../utils/roles'

export interface User {
  username: string
  name: string
  email: string
  phone?: string
  birthday?: string
  role: Role // Changed from string to Role
  branch_id: number
  is_foreign: boolean;
  user_id: number
  status?: string
  created_at?: string
  deleted_at?: string | null
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  birthday?: string
  role?: Role
  branch_id?: number
  status?: string
}

export interface CreateUserPayload {
  username: string
  password: string
  name: string
  email: string
  phone: string
  birthday: string; // YYYY-MM-DD
  role: Role
  branch_id: number
  is_foreign: boolean;
}

export interface AssignedSubject {
  semester_id: number
  semester_name: string
  class_id: number
  class_name: string
  subject_id: number
  subject_name: string
  weekday: string
  classtime_id: number
}
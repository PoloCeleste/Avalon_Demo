import instance from './axiosInstance'
import type { User, UpdateUserPayload, CreateUserPayload, AssignedSubject } from '../types/user'

export interface GetAllUsersParams {
  skip?: number;
  limit?: number;
  branch_id?: number;
  role?: string;
  is_foreign?: boolean;
}

export async function getAllUsers(params?: GetAllUsersParams): Promise<User[]> {
  const res = await instance.get<User[]>('/api/users/', { params });
  return res.data;
}

export async function getUserDetail(user_id: number, branch_id: number): Promise<User> {
  // user_id가 0 또는 없으면 /me 엔드포인트 사용, 그렇지 않으면 특정 user 조회
  if (!user_id) {
    const res = await instance.get<User>(`/api/users/me`)
    return res.data
  }
  const res = await instance.get<User>(`/api/users/${user_id}`)
  return res.data
}

export async function updateUser(
  user_id: number,
  branch_id: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const res = await instance.put<User>(`/api/users/${user_id}/${branch_id}`, payload)
  return res.data
}

export async function deleteUser(user_id: number, branch_id: number): Promise<void> {
  await instance.delete(`/api/users/${user_id}/${branch_id}`);
}

export async function createUser(payload: CreateUserPayload) {
  const res = await instance.post('/api/users/', payload)
  return res.data
}

export interface UpdateMyPasswordPayload {
  current_password: string;
  new_password: string;
}

export async function updateMyPassword(payload: UpdateMyPasswordPayload): Promise<{ message: string }> {
  const res = await instance.put<{ message: string }>('/api/users/me/password', payload);
  return res.data;
}

export async function getMyInfo(): Promise<User> {
  const res = await instance.get<User>('/api/users/me');
  return res.data;
}

export interface UpdateMyInfoPayload {
  name?: string;
  email?: string;
  phone?: string;
}

export async function updateMyInfo(payload: UpdateMyInfoPayload): Promise<User> {
  const res = await instance.put<User>('/api/users/me', payload);
  return res.data;
}

export interface GetAvailableTeachersParams {
  session_date: string; // YYYY-MM-DD
  classtime_id: number;
}

export async function getAvailableTeachers(params: GetAvailableTeachersParams): Promise<User[]> {
  const res = await instance.get<User[]>('/api/users/available-teachers', { params });
  return res.data;
}

export async function getAssignedSubjects(
  user_id: number,
  semester_id?: number,
): Promise<AssignedSubject[]> {
  const params = semester_id ? { semester_id } : {}
  const res = await instance.get<AssignedSubject[]>(`/api/users/${user_id}/assigned-subjects`, {
    params,
  })
  return res.data
}

export async function getAssignedClasses(
  user_id: number,
  semester_id?: number,
): Promise<any[]> {
  const params = semester_id ? { semester_id } : {}
  const res = await instance.get<any[]>(`/api/users/${user_id}/assigned-classes`, {
    params,
  })
  return res.data
}
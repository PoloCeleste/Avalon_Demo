// src/api/auth.api.ts
import instance from './axiosInstance'
import type { User } from '../types/user'

// 로그인: 서버가 HttpOnly 쿠키 세팅. 응답 바디는 신뢰하지 않고 곧바로 getMe 호출 예정.
export async function login(username: string, password: string): Promise<void> {
  await instance.post('/api/auth/login', { username, password })
}

// 로그아웃: 쿠키 삭제
export async function logout(): Promise<void> {
  await instance.post('/api/auth/logout')
}

// 토큰 갱신: 인터셉터에서만 사용(노출해도 무방)
export async function refresh(): Promise<void> {
  await instance.post('/api/auth/refresh')
}

// 현재 사용자
export async function getMe(): Promise<User> {
  const res = await instance.get<User>('/api/users/me')
  return res.data
}

// 최초 로그인 비밀번호 변경(계정 활성화)
export async function resetPasswordFirstLogin(params: {
  username: string
  old_password: string
  new_password: string
}): Promise<void> {
  await instance.post('/api/auth/reset-password', params)
}

// 비밀번호 재설정 요청(이메일)
export async function forgotPassword(email: string, username?: string): Promise<void> {
  const requestBody: { email: string; username?: string } = { email }

  // username이 제공된 경우에만 추가
  if (username) {
    requestBody.username = username
  }

  await instance.post('/api/auth/forgot-password', requestBody)
}

// 재설정 토큰으로 최종 변경
export async function confirmResetPassword(params: {
  token: string
  new_password: string
}): Promise<void> {
  await instance.post('/api/auth/confirm-reset-password', params)
}

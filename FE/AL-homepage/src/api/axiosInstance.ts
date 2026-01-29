// src/api/axiosInstance.ts
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import { useSemesterStore } from '../store/semesterStore'

// ✅ --- Request Cancellation Logic ---

// 1. Axios 설정에 커스텀 속성(requestId) 추가
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  requestId?: string
}

// 진행 중인 요청을 저장하는 Map
const pendingRequests = new Map<string, AbortController>()

// 모든 진행 중인 요청을 취소하는 함수
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller, requestId) => {
    console.log(`[Request Cancellation] Cancelling request: ${requestId}`)
    controller.abort()
  })
  pendingRequests.clear()
}

// 요청 식별자 생성을 위한 카운터
let requestIdCounter = 0
// ✅ --- End of Request Cancellation Logic ---

type RetryableConfig = CustomAxiosRequestConfig & { _retry?: boolean }

const baseURL = import.meta.env.VITE_API_BASE_URL as string

const instance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000,
})

// 학기 정보가 없어도 항상 허용되어야 하는 API 경로 목록
const ALWAYS_ALLOWED_PATHS = [
  '/api/auth', // 인증 관련
  '/api/branches', // 지점 조회
  '/api/users', // 내 정보, 교사, 학생 등 사용자 정보 관련
  '/api/students', // 학생 관리
  '/api/curriculums', // 커리큘럼 관리
]

// ✅ 여러 개로 나뉘어 있던 요청 인터셉터를 하나로 통합
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): CustomAxiosRequestConfig | Promise<CustomAxiosRequestConfig> => {
    const customConfig = config as CustomAxiosRequestConfig

    // --- 1. 요청 취소 로직 ---
    // 개별적으로 signal이 설정된 요청은 건너뜀
    if (!customConfig.signal) {
      const controller = new AbortController()
      const requestId = `request_${requestIdCounter++}`
      customConfig.signal = controller.signal
      customConfig.requestId = requestId

      pendingRequests.set(requestId, controller)
      console.log(`[Request Start] Added to pending: ${requestId}, URL: ${customConfig.url}`)
    }

    // --- 2. 학기 선택 여부 확인 로직 ---
    const { semesters, semestersFetched } = useSemesterStore.getState()
    const isAllowedPath = ALWAYS_ALLOWED_PATHS.some(path => customConfig.url?.startsWith(path))

    // 학기 관련 API는 항상 허용
    if (!customConfig.url?.startsWith('/api/semesters')) {
      // 학기 정보가 로드되었는데, 학기가 하나도 없는 경우
      if (semestersFetched && semesters.length === 0 && !isAllowedPath) {
        const cancelMessage = `[Request Canceled] No semesters exist. URL: ${customConfig.url}`
        console.warn(cancelMessage)
        // 요청을 거부하고 취소 처리
        return Promise.reject(new axios.Cancel(cancelMessage))
      }
    }

    // --- 3. 요청 데이터의 'role'을 소문자로 변경하는 로직 ---
    if (customConfig.data && typeof customConfig.data === 'object' && 'role' in customConfig.data) {
      customConfig.data = { ...customConfig.data, role: customConfig.data.role.toLowerCase() }
    }

    // --- 4. API 요청 로깅 로직 ---
    const authStore = useAuthStore.getState()
    const userRole = authStore.user?.role

    console.log(`[API Request] URL: ${customConfig.url}, Method: ${customConfig.method?.toUpperCase()}`)
    console.log(`[API Request] User Role: ${userRole?.toLowerCase() || 'N/A'}`)
    if (customConfig.data) {
      console.log('[API Request] Data:', customConfig.data)
    }

    return customConfig
  },
  error => {
    return Promise.reject(error)
  },
)

// ✅ 응답 인터셉터 수정
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as CustomAxiosRequestConfig
    // 요청이 성공적으로 완료되면 pendingRequests에서 제거
    if (config.requestId && pendingRequests.has(config.requestId)) {
      pendingRequests.delete(config.requestId)
      console.log(`[Request Success] Removed from pending: ${config.requestId}`)
    }

    // 기존 응답 로깅
    console.log(`[API Response] URL: ${config.url}, Status: ${response.status}`)
    if (response.data) {
      console.log('[API Response] Data:', response.data)
    }
    return response
  },
  async error => {
    // 요청이 취소된 경우, pendingRequests에서 제거하고 에러를 전파
    if (axios.isCancel(error)) {
      // Axios 취소 에러의 경우, error 객체에 config가 포함되어 있을 수 있습니다.
      // 타입 안전성을 위해 error가 'config' 속성을 가지고 있는지 확인합니다.
      if ('config' in error && error.config) {
        const config = error.config as CustomAxiosRequestConfig
        if (config?.requestId && pendingRequests.has(config.requestId)) {
          pendingRequests.delete(config.requestId)
        }
        console.log(`[Request Canceled] URL: ${config?.url}`, error.message)
      } else {
        console.log('[Request Canceled] A request was canceled, but no config was found on the error object.')
      }
      return Promise.reject(error)
    }

    const config = error.config as RetryableConfig
    // 그 외 에러 발생 시, pendingRequests에서 제거
    if (config?.requestId && pendingRequests.has(config.requestId)) {
      pendingRequests.delete(config.requestId)
      console.log(`[Request Failed] Removed from pending: ${config.requestId}`)
    }

    const status = error?.response?.status

    // 로그인 관련 엔드포인트는 재시도 로직에서 제외
    if (
      config.url?.includes('/api/auth/login') ||
      config.url?.includes('/api/auth/logout') ||
      config.url?.includes('/api/auth/refresh') ||
      config.url?.includes('/api/auth/forgot-password') ||
      config.url?.includes('/api/auth/confirm-reset-password')
    ) {
      return Promise.reject(error)
    }

    // 403 에러는 UI에서 처리하도록 그대로 반환
    if (status === 403) {
      return Promise.reject(error)
    }

    // 401 에러(토큰 만료) 시, 1회만 재시도
    if (status === 401 && !config?._retry) {
      config._retry = true
      const store = useAuthStore.getState()

      if (store._refreshPromise) {
        try {
          await store._refreshPromise
          return instance(config)
        } catch (e) {
          await store.logout()
          return Promise.reject(e)
        }
      }

      const p = instance.post('/api/auth/refresh').then(() => {})
      store._setRefreshPromise(p)

      try {
        await p
        store._setRefreshPromise(null)
        return instance(config)
      } catch (e) {
        store._setRefreshPromise(null)
        await store.logout()
        return Promise.reject(e)
      }
    }

    return Promise.reject(error)
  },
)

export default instance
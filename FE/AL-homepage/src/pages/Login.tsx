// src/pages/Login.tsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AxiosError } from 'axios'


interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(s => s.login)

  // 데모용 기본값
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 클라이언트 유효성 검사
    if (!username.trim()) {
      setError('아이디를 입력해주세요.')
      return
    }
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // ✅ 타임아웃 추가로 무한 대기 방지
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 8000) // 8초 타임아웃
      })

      await Promise.race([login(username, password), timeoutPromise])

      // 로그인 성공 시 원래 가려던 페이지로 이동하거나 홈으로 이동
      const from = (location.state as LocationState)?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error('Login Error:', err)

      if (err instanceof Error && err.message === 'TIMEOUT') {
        setError('요청 시간이 초과되었습니다. 다시 시도해주세요.')
      } else if (err instanceof AxiosError) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          setError('서버 응답 시간이 초과되었습니다.')
        } else {
          const status = err?.response?.status

          if (status === 403) {
            setError('계정이 비활성화 상태입니다.')
          } else if (status === 401) {
            setError('입력한 정보가 올바르지 않습니다.')
          } else {
            setError('로그인에 실패했습니다. 잠시 후 다시 시도하세요.')
          }
        }
      } else {
        setError('알 수 없는 오류가 발생했습니다.')
      }
    } finally {
      // ✅ 반드시 loading 해제
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">데모</h1>
          <p className="text-gray-600 mt-2">학원 관리시스템</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                id="username"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={username}
                onChange={e => {
                  setUsername(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="아이디를 입력하세요"
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>

            {/* ✅ 에러 메시지 고정 여백 (항상 한 줄 높이 유지) */}
            <div className="h-5 flex items-center justify-center">
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

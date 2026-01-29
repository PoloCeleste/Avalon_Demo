// src/guards/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'
import Loading from '../components/ui/Loading'

export default function ProtectedRoute() {
  const { isAuthenticated, checkAuth, appReady } = useAuthStore()

  useEffect(() => {
    // 보호된 라우트 접근 시에만 인증 체크 실행
    if (!isAuthenticated && !appReady) {
      checkAuth()
    }
  }, [isAuthenticated, appReady, checkAuth])

  // 앱이 준비되지 않았으면 로딩 표시
  if (!appReady) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  // 인증되지 않았으면 로그인 페이지로 리디렉션
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

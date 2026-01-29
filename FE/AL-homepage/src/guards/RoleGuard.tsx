// src/guards/RoleGuard.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { routeMeta } from '../utils/routeMeta'

export default function RoleGuard() {
  const location = useLocation()
  const { user, appReady } = useAuthStore()

  if (!appReady) return <div style={{ padding: 24 }}>로딩...</div>
  if (!user) return <Navigate to="/login" replace />

  const meta = routeMeta.find(rm => {
    const basePath = location.pathname.split('/')[1]
    const rmBasePath = rm.path.split('/')[1]
    return basePath === rmBasePath
  })

  if (!meta) return <Outlet />

  const allowedRoles = meta.roles
  const hasAccess = allowedRoles.includes(user.role)
  if (!hasAccess) return <Navigate to="/forbidden" replace />

  return <Outlet />
}

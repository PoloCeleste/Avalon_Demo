// src/components/layouts/SideNav.tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FULL_ADMIN, ADMINISH } from '../../utils/roles'
import type { Role } from '../../utils/roles'

export default function SideNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const navLinkBase =
    'flex items-center gap-3 px-4 py-2 text-base font-medium rounded-lg transition-colors duration-150 group'
  const navLinkActive = 'bg-blue-600 text-white shadow-lg'
  const navLinkDefault = 'text-gray-300 hover:text-white hover:bg-gray-700'

  const NavItem = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : navLinkDefault}`}
      style={{
        transform: 'none',
        backfaceVisibility: 'hidden',
      }}
    >
      <span className="text-lg w-6 flex justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
    </NavLink>
  )

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="h-28 px-6 flex items-center">
        {' '}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div className="flex flex-col">
            {' '}
            <h1 className="text-2xl font-bold text-white">데모</h1>{' '}
            <p className="text-sm text-gray-400">학원 관리시스템</p>{' '}
          </div>
        </div>
      </div>

      <div className="py-2 px-3">
        <div className="h-px bg-gray-700"></div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/" icon="🏠" label="대시보드" />
        <NavItem to="/my-page" icon="👤" label="마이페이지" />

        <div className="pt-3">
          <div className="px-3 mb-3">
            <div className="h-px bg-gray-700"></div>
          </div>

          <NavItem to="/students" icon="👥" label="학생" />
          <NavItem to="/teachers" icon="🧑‍🏫" label="교사" />
          <NavItem to="/classes" icon="📚" label="반" />
        </div>

        <div className="pt-3">
          <div className="px-3 mb-3">
            <div className="h-px bg-gray-700"></div>
          </div>

          <NavItem to="/homeworks" icon="📝" label="숙제" />
        </div>

        <div className="pt-3">
          <div className="px-3 mb-3">
            <div className="h-px bg-gray-700"></div>
          </div>

          <div className="space-y-1">
            <NavItem to="/admin/calendars" icon="📅" label="캘린더 관리" />

            {ADMINISH.includes(user.role as Role) && (
              <>
                <NavItem to="/admin/curriculums" icon="📘" label="커리큘럼 관리" />
                <NavItem to="/admin/accounts" icon="👥" label="계정 관리" />
              </>
            )}

            {FULL_ADMIN.includes(user.role as Role) && (
              <>
                <NavItem to="/admin/semesters" icon="🎓" label="학기 관리" />
                <NavItem to="/admin/branches" icon="🏢" label="지점 관리" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 하단 사용자 정보 및 로그아웃 */}
      <div className="border-t border-gray-700 px-4 py-2 space-y-1">
        {/* '유저' 정보 */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.name?.[0] || user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name || user.username}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>
        {/* '로그아웃' 버튼 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-150"
          style={{
            transform: 'none',
            backfaceVisibility: 'hidden',
          }}
        >
          <span className="text-lg">🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  )
}

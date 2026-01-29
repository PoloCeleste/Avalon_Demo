import { FULL_ADMIN, ADMINISH, ALL_ROLES } from './roles'

export const routeMeta = [
  { path: '/', roles: ALL_ROLES },

  // 학생
  { path: '/students', roles: ALL_ROLES },
  { path: '/students/new', roles: ADMINISH }, // TEACHER 불가
  { path: '/students/:id', roles: ADMINISH },

  // 선생님
  { path: '/teachers', roles: ALL_ROLES },
  { path: '/teachers/new', roles: ADMINISH },
  { path: '/teachers/:id', roles: ADMINISH },

  // 반
  { path: '/classes', roles: ALL_ROLES },
  { path: '/classes/new', roles: ADMINISH },
  { path: '/classes/:id', roles: ADMINISH },

  // 마이페이지
  { path: '/my-page', roles: ALL_ROLES },

  // 관리(admin) 영역
  { path: '/admin/reports', roles: ALL_ROLES }, // TEACHER도 보고서 접근 가능
  { path: '/admin/messages', roles: ALL_ROLES }, // TEACHER도 가능
  { path: '/admin/curriculums', roles: ADMINISH },
  { path: '/admin/schedules', roles: ADMINISH },
  {
    path: '/admin/accounts',
    roles: ADMINISH,
    title: '계정 관리',
  },
  {
    path: '/admin/accounts/new',
    roles: ADMINISH,
    title: '새 계정 생성',
  },
  {
    path: '/admin/accounts/:id',
    roles: ADMINISH,
    title: '계정 상세',
    checkDetail: true, // 상세 권한 체크 필요
  },
  { path: '/admin/branches', roles: FULL_ADMIN }, // 지점 관리: SUPER_ADMIN, ADMIN만 가능
]

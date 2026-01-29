// src/utils/roles.ts
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TEACHER: 'TEACHER',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// 권한 계층 (높은 순서)
export const ROLE_HIERARCHY: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER']

export const ALL_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER']

export function normalizeRole(raw: string): Role {
  if (!raw) return 'TEACHER'

  const upper = raw.trim().toUpperCase() as Role

  return (ALL_ROLES as readonly string[]).includes(upper) ? upper : 'TEACHER'
}

// 관리자급 권한
export const FULL_ADMIN: Role[] = ['SUPER_ADMIN', 'ADMIN']
export const ADMINISH: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER']

// 계정 생성 권한 체크
export function canCreateAccounts(userRole: Role): boolean {
  return ADMINISH.includes(userRole)
}

// 특정 역할이 다른 역할을 관리할 수 있는지 체크
export function canManageUser(managerRole: Role, targetRole: Role): boolean {
  const managerIndex = ROLE_HIERARCHY.indexOf(managerRole)
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole)

  if (managerIndex === -1 || targetIndex === -1) return false

  // 자신보다 낮은 등급이거나 같은 등급만 관리 가능
  return managerIndex < targetIndex
}

// 계정 정보를 볼 수 있는지 체크 (비활성화 계정 포함)
export function canViewUser(viewerRole: Role, targetRole: Role, targetStatus?: string): boolean {
  // SUPER_ADMIN과 ADMIN은 비활성화 계정도 볼 수 있음
  if (['SUPER_ADMIN', 'ADMIN'].includes(viewerRole)) {
    return canManageUser(viewerRole, targetRole)
  }

  // MANAGER 이하는 활성 계정만 볼 수 있음
  if (targetStatus && targetStatus.toUpperCase() !== 'ACTIVE') {
    return false
  }

  return canManageUser(viewerRole, targetRole)
}

// 계정을 수정할 수 있는지 체크
export function canEditUser(editorRole: Role, targetRole: Role): boolean {
  return canManageUser(editorRole, targetRole)
}

// 역할과 상태를 수정할 수 있는지 체크
export function canEditRoleAndStatus(userRole: Role): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(userRole)
}

// 계정을 소프트 삭제할 수 있는지 체크
export function canSoftDelete(userRole: Role): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(userRole)
}

// 특정 역할이 생성할 수 있는 역할들 반환
export function getCreatableRoles(creatorRole: Role): Role[] {
  switch (creatorRole) {
    case 'SUPER_ADMIN':
      // SUPER_ADMIN은 모든 역할을 생성할 수 있습니다.
      return ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER']
    case 'ADMIN':
      // ADMIN은 자신을 포함한 하위 역할을 생성할 수 있습니다.
      return ['ADMIN', 'MANAGER', 'TEACHER']
    case 'MANAGER':
      // MANAGER는 TEACHER만 생성할 수 있습니다.
      return ['TEACHER']
    case 'TEACHER':
      // TEACHER는 아무 역할도 생성할 수 없습니다.
      return []
    default:
      // 예외 처리: 혹시 모를 다른 역할 값이 들어올 경우 빈 배열을 반환합니다.
      return []
  }
}

// 역할별 색상 매핑 (Badge 컴포넌트용)
export function getRoleColor(role: string) {
  switch (role?.toUpperCase()) {
    case 'SUPER_ADMIN':
      return 'danger'
    case 'ADMIN':
      return 'warning'
    case 'MANAGER':
      return 'primary'
    case 'TEACHER':
      return 'success'
    default:
      return 'neutral'
  }
}

// 상태별 색상 매핑 (Badge 컴포넌트용)
export function getStatusColor(status?: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'warning'
    case 'SUSPENDED':
      return 'danger'
    default:
      return 'neutral'
  }
}

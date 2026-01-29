import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { getUserDetail, updateUser } from '../../api/user.api'
import { AxiosError } from 'axios'
import { useAuthStore } from '../../store/authStore'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import type { User, UpdateUserPayload } from '../../types/user'
import type { Role } from '../../utils/roles'
import {
  canViewUser,
  canEditUser,
  canEditRoleAndStatus,
  getCreatableRoles,
  ROLES,
} from '../../utils/roles'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading'
import StyledTabs from '../../components/ui/StyledTabs' // ✨ 1. StyledTabs import

interface AccountData {
  user_id: number
  username: string
  name?: string
  email?: string
  phone?: string
  role: Role
  status?: string
  created_at?: string
  branch_id: number
  birthday?: string
  is_foreign?: boolean
}

interface FormData {
  name?: string
  email?: string
  phone?: string
  birthday?: string
  status: string
  role?: string
  is_foreign?: boolean
}

function normalizeRole(raw: string): Role {
  if (!raw) return ROLES.TEACHER
  const upper = raw.toUpperCase() as Role
  if (ROLES.SUPER_ADMIN === upper) return ROLES.SUPER_ADMIN
  if (ROLES.ADMIN === upper) return ROLES.ADMIN
  if (ROLES.MANAGER === upper) return ROLES.MANAGER
  if (ROLES.TEACHER === upper) return ROLES.TEACHER
  return ROLES.TEACHER
}

export default function AccountDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = useAuthStore(s => s.user)

  const { setTitle, setDescription, setActions, setEntityName } = usePageHeader()

  const [account, setAccount] = useState<AccountData | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    status: 'ACTIVE',
    role: ROLES.TEACHER,
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasAccess = me && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(normalizeRole(me.role))

  const meRole = me ? normalizeRole(me.role) : ''
  const accountRole = account ? normalizeRole(account.role) : ''
  const canView =
    account && me ? canViewUser(meRole as Role, accountRole as Role, account.status) : false
  const canEdit = account && me ? canEditUser(meRole as Role, accountRole as Role) : false
  const canEditRoleStatus = me ? canEditRoleAndStatus(meRole as Role) : false

  const handleSave = useCallback(async () => {
    if (!id || !me?.branch_id || !canEdit) return

    setError(null)
    setMessage(null)

    try {
      const updateData: UpdateUserPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        birthday: form.birthday,
      }

      if (canEditRoleStatus) {
        updateData.status = form.status
        const normalizedRole = normalizeRole((form.role as Role) || ROLES.TEACHER)
        updateData.role = normalizedRole.toLowerCase() as Role
      }

      const updatedUser = await updateUser(Number(id), me.branch_id, updateData)
      setAccount(prev => (prev ? { ...prev, ...updatedUser } : null))
      setMessage('계정 정보가 저장되었습니다.')
      setEditMode(false)
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        setError(e?.response?.data?.error?.message || '저장에 실패했습니다.')
      } else {
        setError('알 수 없는 오류가 발생했습니다.')
      }
    }
  }, [id, me, canEdit, canEditRoleStatus, form])

  const cancelEdit = useCallback(() => {
    if (account) {
      setForm({
        name: account.name,
        email: account.email,
        phone: account.phone,
        birthday: account.birthday,
        status: account.status || 'ACTIVE',
        role: account.role,
        is_foreign: account.is_foreign,
      })
    }
    setEditMode(false)
  }, [account])

  useEffect(() => {
    if (account) {
      setTitle(account.name || account.username)
      setDescription(`${account.name || account.username} 계정 정보를 확인할 수 있습니다`)
      setActions(
        <Button variant="outline" onClick={() => navigate('/admin/accounts')}>
          목록으로
        </Button>,
      )
      if (setEntityName) setEntityName(account.username || account.name)
    } else if (!loading) {
      setTitle('접근 제한')
      setActions(
        <Button variant="outline" onClick={() => navigate('/admin/accounts')}>
          목록으로
        </Button>,
      )
      if (setEntityName) setEntityName(undefined)
    }

    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
      if (setEntityName) setEntityName(undefined)
    }
  }, [account, loading, navigate, setActions, setDescription, setTitle, setEntityName])

  useEffect(() => {
    if (!id || !me?.branch_id || !hasAccess) {
      setLoading(false)
      return
    }

    getUserDetail(Number(id), me.branch_id)
      .then((data: User) => {
        data.role = normalizeRole(data.role || '')
        setAccount(data)
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone,
          birthday: data.birthday,
          status: data.status || 'ACTIVE',
          role: data.role,
          is_foreign: data.is_foreign || false,
        })
      })
      .catch(() => setError('계정 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [id, me, hasAccess])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev: FormData) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const getRoleColor = (role: string) => {
    switch (normalizeRole(role)) {
      case ROLES.SUPER_ADMIN:
        return 'danger'
      case ROLES.ADMIN:
        return 'warning'
      case ROLES.MANAGER:
        return 'primary'
      case ROLES.TEACHER:
        return 'success'
      default:
        return 'neutral'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'success'
      case 'INACTIVE':
        return 'warning'
      case 'DELETED':
        return 'neutral'
      case 'SUSPENDED':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  if (!me || !hasAccess) {
    return <Navigate to="/forbidden" replace />
  }

  if (loading) return <Loading />
  if (error && !account) return <div className="p-6 text-red-600">{error}</div>
  if (!account) return <div className="p-6">계정 정보를 찾을 수 없습니다.</div>

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">정보 열람 권한이 없습니다</h3>
          <p className="text-yellow-800 text-sm">동급 이상의 사용자 정보는 열람할 수 없습니다.</p>
        </div>
      </div>
    )
  }

  // ✨ 2. StyledTabs에 전달할 데이터 배열 생성
  const accountTabs = [
    {
      id: 'personal-info',
      label: '계정 정보',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측 프로필 요약 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-700">
                {account.name?.[0] || account.username.toUpperCase()}
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900">
                {account.name || account.username}
              </h3>
              <p className="text-md text-gray-500 mb-3">@{account.username}</p>
              <div className="space-y-2">
                <Badge tone={getRoleColor(account.role)}>{account.role}</Badge>
                <br />
                <Badge tone={getStatusColor(account.status)}>{account.status || 'ACTIVE'}</Badge>
              </div>
            </div>
            <div className="text-sm text-gray-600 pt-4 border-t w-full text-center">
              <p className="mb-1">
                등록일:{' '}
                {account.created_at ? new Date(account.created_at).toLocaleDateString() : '-'}
              </p>
              <p>지점: 창원점</p>
            </div>
            {canEdit && (
              <div className="flex gap-2 pt-4">
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)}>정보 수정</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={cancelEdit}>
                      취소
                    </Button>
                    <Button onClick={handleSave}>저장</Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 우측 정보 입력 필드 */}
          <div className="space-y-4">
            <Input
              label="이름"
              name="name"
              value={editMode ? form.name : account.name || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="이메일"
              name="email"
              type="email"
              value={editMode ? form.email : account.email || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="전화번호"
              name="phone"
              value={editMode ? form.phone : account.phone || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="생년월일"
              name="birthday"
              type={account.birthday ? 'date' : 'text'}
              value={account.birthday || '-'}
              disabled
              help="생년월일은 변경할 수 없습니다"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">역할</label>
              {editMode && canEditRoleStatus ? (
                <select
                  value={form.role || account.role}
                  onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {getCreatableRoles(meRole as Role).map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="h-9 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md flex items-center">
                  <Badge tone={getRoleColor(account.role)}>{account.role}</Badge>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">계정 상태</label>
              {editMode && canEditRoleStatus ? (
                <select
                  name="status"
                  value={form.status}
                  onChange={e => setForm((prev: FormData) => ({ ...prev, status: e.target.value }))}
                  className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">활성</option>
                  <option value="INACTIVE">비활성</option>
                  <option value="SUSPENDED">정지</option>
                  <option value="DELETED">삭제</option>
                </select>
              ) : (
                <div className="h-9 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md flex items-center">
                  <Badge tone={getStatusColor(account.status)}>{account.status || 'ACTIVE'}</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'work-info',
      label: '활동 내역',
      content: (
        <div className="text-center py-12 text-gray-500">
          <p>추후 개발을 위한 영역입니다.</p>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {(error || message) && (
        <div
          className={`p-4 rounded-lg ${
            error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
          }`}
        >
          <p className={`text-sm ${error ? 'text-red-800' : 'text-green-800'}`}>
            {error || message}
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {/* ✨ 3. 기존 Tabs를 StyledTabs로 교체 */}
          <StyledTabs tabs={accountTabs} defaultTabId="personal-info" />
        </CardContent>
      </Card>
    </div>
  )
}

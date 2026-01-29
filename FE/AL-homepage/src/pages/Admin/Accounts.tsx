import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsers } from '../../api/user.api'
import { useAuthStore } from '../../store/authStore'
import { usePageHeader } from '../../contexts/PageHeaderContext' // 1. usePageHeader 훅 import
import { canViewUser, type Role } from '../../utils/roles'
import type { User } from '../../types/user'
// import PageHeader from '../../components/page/PageHeader' // 2. PageHeader 직접 import 제거
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading' // Loading 컴포넌트 추가

interface UserData {
  user_id: number
  username: string
  name?: string
  email?: string
  phone?: string
  role: Role
  status?: string
  created_at?: string
}

export default function AccountsPage() {
  const navigate = useNavigate()
  const me = useAuthStore(s => s.user)
  // 3. usePageHeader 훅 호출
  const { setTitle, setDescription, setActions } = usePageHeader()

  const [users, setUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canCreateAccount = me && ['SUPER_ADMIN', 'ADMIN'].includes(me.role)
  const hasViewAccess = me && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(me.role)

  // 4. useEffect를 사용하여 헤더 내용 설정
  useEffect(() => {
    setTitle('계정 관리')
    setDescription('시스템 사용자 계정을 관리하고 권한을 설정할 수 있습니다')
    setActions(
      canCreateAccount ? (
        <Button onClick={() => navigate('/admin/accounts/new')}>➕ 새 계정 생성</Button>
      ) : null,
    )

    // 5. 페이지를 벗어날 때 헤더 내용 초기화
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions, canCreateAccount, navigate])

  useEffect(() => {
    if (hasViewAccess) {
      getAllUsers()
        .then((data: User[]) => {
          setUsers(data)
        })
        .catch(() => setError('계정 목록을 불러오지 못했습니다.'))
        .finally(() => setLoading(false))
    } else {
      setError('계정 목록을 볼 권한이 없습니다.')
      setLoading(false)
    }
  }, [me, hasViewAccess])

  const filteredUsers = users.filter((user: UserData) =>
    [user.username, user.name, user.email].some((v: string | undefined) =>
      v?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  const getRoleColor = (role: string) => {
    switch (role.toUpperCase()) {
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
  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'success'
      case 'INACTIVE':
        return 'warning'
      case 'SUSPENDED':
        return 'danger'
      case 'DELETED':
        return 'primary'
      default:
        return 'neutral'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loading />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!hasViewAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚫</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">접근 권한이 없습니다</h3>
              <p className="text-gray-600">계정 관리 페이지에 접근할 권한이 없습니다.</p>
              <Button className="mt-4" onClick={() => navigate('/')} variant="outline">
                홈으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    // 6. 기존 PageHeader 컴포넌트 제거
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="아이디, 이름, 이메일로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Card>
        <CardHeader title="계정 목록" subtitle={`총 ${filteredUsers.length}개의 계정`} />
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 계정이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      사용자
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      이메일
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      역할
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      상태
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      등록일
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: UserData) => (
                    <tr
                      key={user.user_id}
                      className="border-b border-gray-100 hover:bg-gray-200 even:bg-gray-100"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {user.name?.[0] || user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-gray-500">
                              {user.name || user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge tone={getRoleColor(user.role)}>{user.role}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={getStatusColor(user.status)}>{user.status || 'ACTIVE'}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {user.user_id === me?.user_id ? (
                          <Button variant="ghost" size="sm" onClick={() => navigate('/my-page')}>
                            내 정보
                          </Button>
                        ) : me &&
                          canViewUser(
                            me.role,
                            user.role.toUpperCase() as Role,
                            user.status?.toUpperCase(),
                          ) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/accounts/${user.user_id}`)}
                          >
                            상세
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled title="권한이 없습니다">
                            제한됨
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useMemo, useCallback, useEffect } from 'react' // useEffect 추가
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePageHeader } from '../../contexts/PageHeaderContext' // 1. usePageHeader 훅 import
import { createUser } from '../../api/user.api'
import type { CreateUserPayload } from '../../types/user'
import { getCreatableRoles, canCreateAccounts, type Role, ROLES } from '../../utils/roles'
import { AxiosError } from 'axios'
// import PageHeader from '../../components/page/PageHeader' // 2. PageHeader 직접 import 제거
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { Label } from '../../components/ui/Label'

const BRANCHES = [{ id: 1, name: '창원점' }]

interface FormState {
  username: string
  name: string
  email: string
  phone: string
  birthday: string
  is_foreign: boolean
  role: Role
}

export default function AccountCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // 3. usePageHeader 훅 호출
  const { setTitle, setDescription, setActions } = usePageHeader()

  const [form, setForm] = useState<FormState>({
    username: '',
    name: '',
    email: '',
    phone: '',
    birthday: '',
    is_foreign: false,
    role: ROLES.TEACHER,
  })
  const [branchName, setBranchName] = useState(BRANCHES[0].name)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canCreate = useMemo(() => {
    return user ? canCreateAccounts(user.role as Role) : false
  }, [user])

  const roleOptions = useMemo(() => {
    return user ? getCreatableRoles(user.role as Role) : []
  }, [user])

  // 4. useEffect를 사용하여 헤더 내용 설정
  useEffect(() => {
    setTitle('새 계정 생성')
    setDescription('새로운 사용자 계정을 생성합니다')
    setActions(
      <Button variant="outline" onClick={() => navigate('/admin/accounts')}>
        목록으로 돌아가기
      </Button>,
    )

    // 5. 페이지를 벗어날 때 헤더 내용 초기화
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions, navigate])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev: FormState) => ({ ...prev, [name]: value }))
  }, [])

  const validate = useCallback(() => {
    if (!form.username || !form.name || !form.email || !form.phone) {
      return '필수 항목이 비어 있습니다. (아이디/이름/이메일/전화번호)'
    }
    if (!/^[A-Za-z0-9._-]+$/.test(form.username)) {
      return '아이디(영어 이름)는 영문/숫자/._- 만 사용할 수 있습니다.'
    }
    if (!form.birthday || !/^\d{4}-\d{2}-\d{2}$/.test(form.birthday)) {
      return '생년월일은 YYYY-MM-DD 형식이어야 합니다.'
    }
    if (!form.role) return '역할을 선택하세요.'
    if (!branchName) return '지점을 선택하세요.'
    return null
  }, [form, branchName])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setMessage(null)
      setError(null)
      const v = validate()
      if (v) return setError(v)
      setLoading(true)
      try {
        const branch_id = BRANCHES.find(b => b.name === branchName)?.id ?? 1
        const payload: CreateUserPayload = {
          username: form.username,
          password: form.phone,
          name: form.name,
          email: form.email,
          phone: form.phone,
          birthday: form.birthday,
          role: form.role,
          branch_id,
          is_foreign: form.is_foreign,
        }
        await createUser(payload)
        setMessage(
          '계정이 생성되었습니다. 최초 비밀번호는 "전화번호"입니다. 로그인 후 비밀번호를 변경하세요.',
        )
        setForm({
          username: '',
          name: '',
          email: '',
          phone: '',
          birthday: '',
          is_foreign: false,
          role: ROLES.TEACHER,
        })
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          const serverMsg = err?.response?.data?.detail || err?.response?.data?.message
          setError(serverMsg || '계정 생성에 실패했습니다. 입력값을 확인하세요.')
        } else {
          setError('알 수 없는 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    },
    [form, branchName, validate],
  )

  if (!user || !canCreate) {
    return <Navigate to="/forbidden" replace />
  }

  return (
    // 6. 기존 PageHeader 컴포넌트 제거
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader title="계정 정보 입력" subtitle="새로 생성할 계정의 정보를 입력해주세요" />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600">ℹ️</span>
                  <h3 className="text-sm font-medium text-blue-900">비밀번호 설정 안내</h3>
                </div>
                <p className="text-sm text-blue-800">
                  최초 비밀번호는 전화번호와 동일하게 설정됩니다. 계정 생성 후 사용자에게 로그인
                  정보를 전달하고, 최초 로그인 시 비밀번호를 변경하도록 안내해주세요.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="아이디(영어 이름) *"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="예: john"
                  required
                />
                <Input
                  label="이름 *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="이메일 *"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
                <Input
                  label="전화번호 *"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="01012345678"
                  help="이 번호가 최초 비밀번호로 설정됩니다"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="생년월일 *"
                  name="birthday"
                  type="date"
                  value={form.birthday}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="역할 *"
                  options={[
                    { value: '', label: '역할 선택' },
                    ...roleOptions.map(role => ({ value: role, label: role })),
                  ]}
                  value={form.role}
                  onChange={e =>
                    setForm((prev: FormState) => ({ ...prev, role: e.target.value as Role }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_foreign"
                  checked={form.is_foreign}
                  onCheckedChange={checked => setForm(prev => ({ ...prev, is_foreign: !!checked }))}
                />
                <Label htmlFor="is_foreign">외국인 여부</Label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">지점 *</label>
                <div className="space-y-2">
                  {BRANCHES.map(branch => (
                    <label key={branch.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="branch"
                        value={branch.name}
                        checked={branchName === branch.name}
                        onChange={() => setBranchName(branch.name)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">{branch.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium">{message}</p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/accounts')}>
                  취소
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '생성 중...' : '계정 생성'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// src/pages/MyPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { getUserDetail, updateUser } from '../api/user.api'
import type { UpdateUserPayload } from '../types/user'
import instance from '../api/axiosInstance'
import { AxiosError } from 'axios'
import type { User } from '../types/user'
import { usePageHeader } from '../../src/contexts/PageHeaderContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import Loading from '../components/ui/Loading'
import StyledTabs from '../components/ui/StyledTabs'

export default function MyPage() {
  const { user } = useAuthStore()
  const [me, setMe] = useState<User | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<UpdateUserPayload>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 비밀번호 변경 모달 상태
  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '' })
  const [pwdSubmitting, setPwdSubmitting] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)
  const [pwdErr, setPwdErr] = useState<string | null>(null)

  const { setTitle, setDescription, setActions } = usePageHeader()

  const startEdit = useCallback(() => {
    setEditMode(true)
    setMsg(null)
    setErr(null)
  }, [])

  const cancelEdit = useCallback(() => {
    if (me) {
      setForm({
        name: me.name,
        email: me.email,
        phone: me.phone,
        birthday: me.birthday,
      })
    }
    setEditMode(false)
    setMsg(null)
    setErr(null)
  }, [me])

  const saveEdit = useCallback(async () => {
    if (!user?.branch_id || !user.user_id) return
    setErr(null)
    setMsg(null)
    try {
      const updated = await updateUser(user.user_id, user.branch_id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        birthday: form.birthday,
      })
      setMe(updated)
      setMsg('정보가 성공적으로 저장되었습니다.')
      setEditMode(false)
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        setErr(e?.response?.data?.error?.message || '저장에 실패했습니다.')
      } else {
        setErr('알 수 없는 오류가 발생했습니다.')
      }
    }
  }, [user, form])

  useEffect(() => {
    setTitle('마이페이지')
    setDescription('개인정보를 확인하고 수정할 수 있습니다')

    // 페이지 헤더의 actions는 더 이상 사용하지 않으므로 null로 설정하거나 비워둡니다.
    setActions(null)

    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setActions, setTitle, setDescription])

  useEffect(() => {
    let mounted = true
    async function fetchMe() {
      if (!user?.user_id || !user.branch_id) {
        setLoading(false)
        return
      }
      try {
        const data = await getUserDetail(user.user_id, user.branch_id)
        if (!mounted) return
        setMe(data)
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone,
          birthday: data.birthday,
        })
      } catch (e: unknown) {
        if (!mounted) return
        if (e instanceof AxiosError) {
          setErr(e?.response?.data?.error?.message || '내 정보 조회에 실패했습니다.')
        } else {
          setErr('알 수 없는 오류가 발생했습니다.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchMe()
    return () => {
      mounted = false
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev: UpdateUserPayload) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdErr(null)
    setPwdMsg(null)
    setPwdSubmitting(true)
    try {
      await instance.put('/api/users/me/password', {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
      })
      setPwdMsg('비밀번호가 성공적으로 변경되었습니다.')
      setPwdForm({ current_password: '', new_password: '' })
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        setPwdErr(e?.response?.data?.error?.message || '비밀번호 변경에 실패했습니다.')
      } else {
        setPwdErr('알 수 없는 오류가 발생했습니다.')
      }
    } finally {
      setPwdSubmitting(false)
    }
  }

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
      default:
        return 'neutral'
    }
  }

  if (loading) return <Loading />

  if (!me || err) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-red-600">{err || '내 정보를 불러올 수 없습니다.'}</p>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    {
      id: 'personal-info',
      label: '개인 정보',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측 프로필 요약 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-blue-700">
                {me.name?.[0] || me.username.toUpperCase()}
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900">{me.name || me.username}</h3>
              <p className="text-md text-gray-500 mb-3">@{me.username}</p>
              <div className="space-y-2">
                <Badge tone={getRoleColor(me.role)}>{me.role}</Badge>
                <br />
                <Badge tone={getStatusColor(me.status)}>{me.status || 'ACTIVE'}</Badge>
              </div>
            </div>
            <div className="text-sm text-gray-600 pt-4 border-t w-full text-center">
              <p className="mb-1">
                가입일: {me.created_at ? new Date(me.created_at).toLocaleDateString() : '-'}
              </p>
              <p>지점: 창원점</p>
            </div>
            {/* 버튼 영역 */}
            <div className="flex gap-2 pt-4">
              {!editMode ? (
                <>
                  <Button variant="outline" onClick={() => setPwdOpen(true)}>
                    비밀번호 변경
                  </Button>
                  <Button onClick={startEdit}>정보 수정</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={cancelEdit}>
                    취소
                  </Button>
                  <Button onClick={saveEdit}>저장</Button>
                </>
              )}
            </div>
          </div>

          {/* 우측 정보 입력 필드 */}
          <div className="space-y-4">
            <Input
              label="이름"
              name="name"
              value={editMode ? form.name : me.name || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="이메일"
              name="email"
              type="email"
              value={editMode ? form.email : me.email || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="전화번호"
              name="phone"
              value={editMode ? form.phone : me.phone || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="생년월일"
              name="birthday"
              type={me.birthday ? 'date' : editMode ? 'date' : 'text'}
              value={editMode ? form.birthday : me.birthday || '-'}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'work-info',
      label: '업무 정보',
      content: (
        <div className="text-center py-12 text-gray-500">
          <p>업무 정보는 추후 결정될 예정입니다.</p>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {(err || msg) && (
        <div
          className={`p-4 rounded-lg ${
            err ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
          }`}
        >
          <p className={`text-sm ${err ? 'text-red-800' : 'text-green-800'}`}>{err || msg}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <StyledTabs tabs={tabs} defaultTabId="personal-info" />
        </CardContent>
      </Card>

      {pwdOpen && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">비밀번호 변경</h3>
                <button
                  onClick={() => {
                    setPwdOpen(false)
                    setPwdErr(null)
                    setPwdMsg(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">닫기</span>✕
                </button>
              </div>
            </div>
            <form onSubmit={submitPassword} className="px-6 py-4">
              {(pwdErr || pwdMsg) && (
                <div
                  className={`mb-4 p-3 rounded-lg ${
                    pwdErr
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <p className={`text-sm ${pwdErr ? 'text-red-800' : 'text-green-800'}`}>
                    {pwdErr || pwdMsg}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <Input
                  label="현재 비밀번호"
                  type="password"
                  value={pwdForm.current_password}
                  onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                  required
                />
                <Input
                  label="새 비밀번호"
                  type="password"
                  value={pwdForm.new_password}
                  onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  help="최소 4자 이상 입력하세요"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPwdOpen(false)
                    setPwdErr(null)
                    setPwdMsg(null)
                  }}
                >
                  취소
                </Button>
                <Button type="submit" disabled={pwdSubmitting}>
                  {pwdSubmitting ? '변경 중...' : '변경'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// src/pages/Teachers/TeacherList.tsx

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsers } from '../../api/user.api'
import { getTeacherClassPerformance, getTeacherSubjectPerformance } from '../../api/report.api'
import { useAuthStore } from '../../store/authStore'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { ADMINISH, ROLES } from '../../utils/roles'
import type { User } from '../../types/user'
import type {
  TeacherClassPerformanceReport,
  TeacherSubjectPerformanceReport,
} from '../../types/report'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import TeacherPerformanceCard from '../../components/teachers/TeacherPerformanceCard'

const PERFORMANCE_ROLES = [ROLES.TEACHER, ROLES.MANAGER, ROLES.ADMIN] as const

// ✅ Define a precise type for the roles we are checking against.
type PerformanceRole = (typeof PERFORMANCE_ROLES)[number]

const ROLE_ORDER: { [key: string]: number } = {
  [ROLES.TEACHER]: 1,
  [ROLES.MANAGER]: 2,
  [ROLES.ADMIN]: 3,
}

const ROLE_NAMES: { [key: string]: string } = {
  [ROLES.TEACHER]: '교사 (Teacher)',
  [ROLES.MANAGER]: '운영팀 (Manager)',
  [ROLES.ADMIN]: '관리자 (Admin)',
}

interface PerformanceData {
  classPerformance?: TeacherClassPerformanceReport
  subjectPerformance?: TeacherSubjectPerformanceReport
}

export default function TeacherInfoPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [performance, setPerformance] = useState<Record<number, PerformanceData>>({})
  const [isPerformanceLoading, setIsPerformanceLoading] = useState<Record<number, boolean>>({})

  const { selectedSemester, setTitle, setDescription, setActions } = usePageHeader() // ✨ selectedSemester 추가
  const canManageAccounts = user && ADMINISH.includes(user.role)

  const handleManageAccounts = useCallback(() => {
    navigate('/admin/accounts')
  }, [navigate])

  useEffect(() => {
    setTitle('교사 정보')
    setDescription('등록된 사용자들의 정보를 역할별로 확인하고 관리할 수 있습니다.')
    setActions(
      canManageAccounts ? <Button onClick={handleManageAccounts}>👥 계정 관리</Button> : null,
    )
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions, canManageAccounts, handleManageAccounts])

  useEffect(() => {
    getAllUsers()
      .then(data => {
        const filtered = data.filter((u: User) => u.role.toUpperCase() !== ROLES.SUPER_ADMIN)
        const sorted = filtered.sort(
          (a, b) =>
            (ROLE_ORDER[a.role.toUpperCase()] || 99) - (ROLE_ORDER[b.role.toUpperCase()] || 99),
        )
        setUsers(sorted)
      })
      .catch(() => setError('사용자 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // ✨ 선택된 학기가 없으면 API를 호출하지 않음
    if (users.length === 0 || !selectedSemester) return

    users.forEach(u => {
      if (PERFORMANCE_ROLES.includes(u.role.toUpperCase() as PerformanceRole)) {
        setIsPerformanceLoading(prev => ({ ...prev, [u.user_id]: true }))

        Promise.allSettled([
          getTeacherClassPerformance(u.user_id, selectedSemester.semester_id),
          getTeacherSubjectPerformance(u.user_id, selectedSemester.semester_id),
        ])
          .then(([classResult, subjectResult]) => {
            // ✨ 1. 각 API 호출 결과를 담을 변수를 준비합니다.
            let finalClassPerformance: TeacherClassPerformanceReport | undefined = undefined
            let finalSubjectPerformance: TeacherSubjectPerformanceReport | undefined = undefined

            // ✨ 2. 담임반 성과 API가 성공했을 때만 데이터를 처리합니다.
            if (classResult.status === 'fulfilled') {
              const classPerf = classResult.value // 실제 데이터는 .value 안에 있습니다.
              let calculatedClassRate = null
              if (classPerf.class_details && classPerf.class_details.length > 0) {
                const totalRate = classPerf.class_details.reduce(
                  (sum, detail) => sum + detail.completion_rate,
                  0,
                )
                calculatedClassRate = totalRate / classPerf.class_details.length
              }
              finalClassPerformance = {
                ...classPerf,
                overall_completion_rate: calculatedClassRate ?? 0,
              }
            } else {
              // API 호출 실패 시 에러 로그를 남깁니다.
              console.error(
                `Failed to fetch class performance for user ${u.user_id}:`,
                classResult.reason,
              )
            }

            // ✨ 3. 담당 과목 성과 API가 성공했을 때만 데이터를 처리합니다.
            if (subjectResult.status === 'fulfilled') {
              finalSubjectPerformance = subjectResult.value // 실제 데이터는 .value 안에 있습니다.
            } else {
              console.error(
                `Failed to fetch subject performance for user ${u.user_id}:`,
                subjectResult.reason,
              )
            }

            // ✨ 4. 최종적으로 처리된 데이터를 state에 저장합니다.
            setPerformance(prev => ({
              ...prev,
              [u.user_id]: {
                classPerformance: finalClassPerformance,
                subjectPerformance: finalSubjectPerformance,
              },
            }))
          })
          .finally(() => {
            // finally 블록은 Promise.allSettled와 함께 사용할 때 주의가 필요할 수 있으므로,
            // 각 API 호출이 끝난 후 로딩 상태를 해제하도록 .then 블록으로 이동하거나 유지합니다.
            setIsPerformanceLoading(prev => ({ ...prev, [u.user_id]: false }))
          })
      }
    })
    // ✨ 의존성 배열에 selectedSemester 추가
  }, [users, selectedSemester])

  const groupedAndFilteredUsers = useMemo(() => {
    const filtered = users.filter(u =>
      [u.name, u.email, u.username].some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    )
    const grouped: { [key: string]: User[] } = {}
    for (const u of filtered) {
      if (!grouped[u.role]) grouped[u.role] = []
      grouped[u.role].push(u)
    }
    return grouped
  }, [users, searchQuery])

  if (loading) return <Loading />
  if (error) return <div className="text-red-600 text-center p-8">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex-1 max-w-md">
        <Input
          placeholder="이름, 이메일, 아이디로 검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {Object.keys(groupedAndFilteredUsers).length > 0 ? (
          Object.entries(groupedAndFilteredUsers)
            .sort(
              ([roleA], [roleB]) =>
                (ROLE_ORDER[roleA.toUpperCase()] || 99) - (ROLE_ORDER[roleB.toUpperCase()] || 99),
            )
            .map(([role, userList]) => (
              <Card key={role}>
                <CardHeader
                  title={ROLE_NAMES[role.toUpperCase()] || role}
                  subtitle={`총 ${userList.length}명`}
                />
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userList.map(u =>
                      // ✅ FIX: Use the specific 'PerformanceRole' type here as well
                      PERFORMANCE_ROLES.includes(role.toUpperCase() as PerformanceRole) ? (
                        <TeacherPerformanceCard
                          key={u.user_id}
                          user={u}
                          classPerformance={performance[u.user_id]?.classPerformance}
                          subjectPerformance={performance[u.user_id]?.subjectPerformance}
                          isLoading={isPerformanceLoading[u.user_id] ?? true}
                        />
                      ) : (
                        <div key={u.user_id} className="p-4 border rounded-lg">
                          <h3 className="font-medium">
                            {u.username} ({u.name})
                          </h3>
                          <p className="text-sm text-gray-600">{u.email}</p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '검색 결과가 없습니다.' : '표시할 사용자가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  )
}

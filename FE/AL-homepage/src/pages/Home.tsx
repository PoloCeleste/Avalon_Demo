import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { usePageHeader } from '../contexts/PageHeaderContext'
// [추가] 새로운 API 함수와 타입들을 가져옵니다.
import { getLowPerformanceStudents, getLowPerformanceSubjectStudents } from '../api/report.api'
import type { LowPerformanceStudent, LowPerformanceSubjectStudent } from '../types/report'
// [추가] 새로 만든 대시보드 위젯 컴포넌트들을 가져옵니다.
import AverageCompletionWidget from '../components/dashboard/AverageCompletionWidget'
import SubjectCompletionWidget from '../components/dashboard/SubjectCompleteWidget'
import Loading from '../components/ui/Loading'
import TeacherStatusList from '../components/dashboard/TeacherStatusList'
// import { Card, CardContent, CardHeader } from '../components/ui/Card'

export default function HomePage() {
  const { user } = useAuthStore()
  // [수정] selectedSemester를 페이지 헤더에서 가져옵니다. API 호출에 필요합니다.
  const { selectedSemester, setTitle, setDescription } = usePageHeader()

  // [삭제] 기존 useDashboardStore는 더 이상 사용하지 않습니다.
  // const { kpis, topStudents, studentsToWatch, loading, error, fetchDashboardData } = useDashboardStore()

  // [추가] 새로운 대시보드 데이터를 위한 상태들을 정의합니다.
  const [lowAverageStudents, setLowAverageStudents] = useState<LowPerformanceStudent[]>([])
  const [lowSubjectStudents, setLowSubjectStudents] = useState<LowPerformanceSubjectStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle('대시보드')
    setDescription(`안녕하세요, ${user?.name || user?.username}님! 클래스 현황을 확인하세요.`)

    // [수정] 학기가 선택되었을 때만 데이터를 불러오도록 변경합니다.
    if (!selectedSemester) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // [수정] 새로운 대시보드 API 두 개를 동시에 호출합니다.
        const [avgData, subjectData] = await Promise.all([
          getLowPerformanceStudents(selectedSemester.semester_id, 10),
          getLowPerformanceSubjectStudents(selectedSemester.semester_id, 10),
        ])

        setLowAverageStudents(avgData)
        setLowSubjectStudents(subjectData)
      } catch (err) {
        console.error('대시보드 데이터 로딩 실패:', err)
        setError('대시보드 데이터를 불러오는 데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      setTitle(undefined)
      setDescription(undefined)
    }
  }, [user, selectedSemester, setTitle, setDescription]) // selectedSemester 의존성 추가

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>
  }

  // [유지] 이 부분은 개발 환경에서만 대시보드를 보여주기 위해 그대로 둡니다.
  // if (!import.meta.env.DEV) {
  //   return (
  //     <div className="space-y-6">
  //       <Card>
  //         <CardHeader title="메세지 관리" />
  //         <CardContent>
  //           <div className="text-center py-20">
  //             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //               <span className="text-4xl">🎨</span>
  //             </div>
  //             <h3 className="text-xl font-semibold text-gray-800">디자인 확립 중입니다.</h3>
  //             <p className="text-gray-500 mt-2">
  //               더 나은 사용자 경험을 제공하기 위해 대시보드 디자인을 개편하고 있습니다.
  //               <br />곧 새로운 모습으로 찾아뵙겠습니다.
  //             </p>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   )
  // }

  return (
    <div className="space-y-6">
      {/* [유지] 선생님 카드 목록 컴포넌트는 그대로 사용합니다. */}
      <div>
        <TeacherStatusList />
      </div>

      {/* [수정] 기존 KPI 및 현황 카드들을 새로운 위젯으로 교체합니다. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AverageCompletionWidget students={lowAverageStudents} />
        <SubjectCompletionWidget students={lowSubjectStudents} />
      </div>
    </div>
  )
}

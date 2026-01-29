// src/components/teachers/TeacherPerformanceCard.tsx

import { useNavigate } from 'react-router-dom'
import type { User } from '../../types/user'
import type {
  TeacherClassPerformanceReport,
  TeacherSubjectPerformanceReport,
} from '../../types/report'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import ProgressDisplay from '../dashboard/ProgressDisplay'
import Loading from '../ui/Loading'
import { cn } from '../../utils/cn'

interface Props {
  user: User
  classPerformance?: TeacherClassPerformanceReport
  subjectPerformance?: TeacherSubjectPerformanceReport
  isLoading: boolean
}

// 색상 정의 (이전과 동일)
const cardColorVariants = {
  KOREAN: 'bg-blue-50/50 hover:shadow-blue-100',
  NATIVE: 'bg-green-50/50 hover:shadow-green-100',
}
const avatarColorVariants = {
  KOREAN: { bg: 'bg-blue-100', text: 'text-blue-700' },
  NATIVE: { bg: 'bg-green-100', text: 'text-green-700' },
}
const tagColorVariants = {
  KOREAN: 'bg-blue-500 text-white',
  NATIVE: 'bg-green-600 text-white',
}

// PerformanceItem 헬퍼 컴포넌트 (이전과 동일)
// const PerformanceItem = ({
//   label,
//   value,
//   children,
// }: {
//   label: string
//   value?: string
//   children?: React.ReactNode
// }) => (
//   <div className="flex justify-between items-center text-sm py-2">
//     <span className="text-gray-600">{label}</span>
//     {value && <span className="font-semibold text-gray-800">{value}</span>}
//     {children}
//   </div>
// )

export default function TeacherPerformanceCard({
  user,
  classPerformance,
  subjectPerformance,
  isLoading,
}: Props) {
  const navigate = useNavigate()
  const teacherType = user.is_foreign ? 'NATIVE' : 'KOREAN'

  // const overallPerformance =
  //   classPerformance && subjectPerformance
  //     ? (classPerformance.overall_completion_rate + subjectPerformance.overall_completion_rate) / 2
  //     : 0

  return (
    <Card className={cn('p-4 transition-shadow hover:shadow-lg', cardColorVariants[teacherType])}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
            avatarColorVariants[teacherType].bg,
          )}
        >
          <span className={cn('text-xl font-bold', avatarColorVariants[teacherType].text)}>
            {/* ✨ 변경점: 아바타 이니셜을 username 기준으로 표시 */}
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          {/* ✨ 변경점: 이름(name) 대신 아이디(username)를 표시 */}
          <h3 className="font-bold text-lg">{user.username}</h3>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              tagColorVariants[teacherType],
            )}
          >
            {user.is_foreign ? '원어민' : '한국인'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loading />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 담임반 정보 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">담임반 완성률</span>
              <span className="font-semibold text-gray-800">
                {classPerformance?.overall_completion_rate?.toFixed(1) ?? 'N/A'}%
              </span>
            </div>
            <ProgressDisplay value={classPerformance?.overall_completion_rate ?? 0} size="sm" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">관리필요 학생</span>
              <span className="font-semibold text-gray-700">
                {classPerformance?.total_students_below_70_percent ?? '-'}명
              </span>
            </div>
          </div>

          {/* 담당과목 정보 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">담당과목 완성률</span>
              <span className="font-semibold text-gray-800">
                {subjectPerformance?.overall_completion_rate?.toFixed(1) ?? 'N/A'}%
              </span>
            </div>
            <ProgressDisplay value={subjectPerformance?.overall_completion_rate ?? 0} size="sm" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">관리필요 학생</span>
              <span className="font-semibold text-gray-700">
                {subjectPerformance?.total_students_below_70_percent ?? '-'}명
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" block onClick={() => navigate(`/teachers/${user.user_id}`)}>
              상세 정보 보기
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

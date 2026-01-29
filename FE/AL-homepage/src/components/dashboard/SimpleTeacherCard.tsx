// src/components/dashboard/SimpleTeacherCard.tsx

import { useNavigate } from 'react-router-dom'
import type { User } from '../../types/user'
import { cn } from '../../utils/cn'

interface Props {
  user: User
  classRate?: number | null
  subjectRate?: number | null
  classStudentCount?: number // ✨ 추가
  subjectStudentCount?: number // ✨ 추가
}

const cardColorVariants = {
  KOREAN: 'border-blue-300 bg-blue-50',
  NATIVE: 'border-green-300 bg-green-50',
}
const tagColorVariants = {
  KOREAN: 'bg-blue-100 text-blue-800',
  NATIVE: 'bg-green-100 text-green-800',
}
const rateColorVariants = {
  KOREAN: 'text-blue-600',
  NATIVE: 'text-green-600',
}

export default function SimpleTeacherCard({
  user,
  classRate,
  subjectRate,
  classStudentCount, // ✨ 추가
  subjectStudentCount, // ✨ 추가
}: Props) {
  const navigate = useNavigate()
  const teacherType = user.is_foreign ? 'NATIVE' : 'KOREAN'

  return (
    <div
      onClick={() => navigate(`/teachers/${user.user_id}`)}
      className={cn(
        'flex-shrink-0 w-40 p-4 border rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow',
        cardColorVariants[teacherType],
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 mb-2 rounded-full bg-white flex items-center justify-center border-2 border-white">
          <span className="text-xl font-bold text-gray-700">
            {/* 변경점: username을 기준으로 아바타 이니셜을 표시합니다. */}
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* 변경점: 모든 선생님에게 username을 주 이름으로, name을 보조 이름으로 표시합니다. */}
        <p className="font-bold text-gray-800">{user.username}</p>
        <p className="text-sm text-gray-600">{user.name}</p>

        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full mb-3 mt-1',
            tagColorVariants[teacherType],
          )}
        >
          {user.is_foreign ? '원어민' : '한국인'}
        </span>
        <div className="text-sm w-full space-y-2">
          {/* 담임반 정보 */}
          <div>
            <div className="flex justify-between">
              <span className="text-gray-500">담임반</span>
              <span className={cn('font-bold', rateColorVariants[teacherType])}>
                {classRate?.toFixed(0) ?? '-'}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">관리필요</span>
              <span className="font-semibold text-gray-600">{classStudentCount ?? '-'}명</span>
            </div>
          </div>
          {/* 과목별 정보 */}
          <div>
            <div className="flex justify-between">
              <span className="text-gray-500">과목별</span>
              <span className={cn('font-bold', rateColorVariants[teacherType])}>
                {subjectRate?.toFixed(0) ?? '-'}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">관리필요</span>
              <span className="font-semibold text-gray-600">{subjectStudentCount ?? '-'}명</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// src/components/dashboard/TeacherStatusList.tsx

import { useEffect, useState, useMemo } from 'react'
import { getAllUsers } from '../../api/user.api'
import { getTeacherClassPerformance, getTeacherSubjectPerformance } from '../../api/report.api'
import type { User } from '../../types/user'
import { ROLES } from '../../utils/roles'
import SimpleTeacherCard from './SimpleTeacherCard'
import Loading from '../ui/Loading'
import { usePageHeader } from '../../contexts/PageHeaderContext'

// FIX: Check against a strictly typed array to satisfy TypeScript
const TEACHING_ROLES = [ROLES.TEACHER, ROLES.ADMIN, ROLES.MANAGER] as const
type TeachingRole = (typeof TEACHING_ROLES)[number]

interface TeacherPerformance {
  classRate?: number | null
  subjectRate?: number | null
  classStudentCount?: number // ✨ 추가
  subjectStudentCount?: number // ✨ 추가
}

export default function TeacherStatusList() {
  const { selectedSemester } = usePageHeader()
  const [teachers, setTeachers] = useState<User[]>([])
  const [performance, setPerformance] = useState<Record<number, TeacherPerformance>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ✨ 1. 선택된 학기가 없으면 데이터를 불러오지 않음
    if (!selectedSemester) {
      setLoading(false)
      setTeachers([])
      setPerformance({})
      return
    }

    const fetchData = async () => {
      setLoading(true) // 로딩 상태를 여기서 다시 true로 설정
      const allUsers = await getAllUsers()
      const teacherUsers = allUsers.filter(u =>
        TEACHING_ROLES.includes(u.role.toUpperCase() as TeachingRole),
      )
      setTeachers(teacherUsers)

      const performancePromises = teacherUsers.map(async teacher => {
        try {
          const [classPerf, subjectPerf] = await Promise.all([
            getTeacherClassPerformance(teacher.user_id, selectedSemester.semester_id),
            getTeacherSubjectPerformance(teacher.user_id, selectedSemester.semester_id),
          ])

          // ✨ 담임반이 배정되었는지 class_details 배열의 길이로 확인합니다.
          const finalClassRate =
            classPerf.class_details.length > 0 ? classPerf.overall_completion_rate : null

          // ✨ 담당 과목이 배정되었는지 subject_details 배열의 길이로 확인합니다.
          const finalSubjectRate =
            subjectPerf.subject_details.length > 0 ? subjectPerf.overall_completion_rate : null

          return {
            userId: teacher.user_id,
            data: {
              classRate: finalClassRate,
              subjectRate: finalSubjectRate,
              classStudentCount: classPerf.total_students_below_70_percent,
              subjectStudentCount: subjectPerf.total_students_below_70_percent,
            },
          }
        } catch (error) {
          console.error(`Fetching performance for ${teacher.name} failed:`, error)
          return { userId: teacher.user_id, data: {} }
        }
      })

      const performanceResults = await Promise.all(performancePromises)
      const performanceMap = performanceResults.reduce(
        (acc, result) => {
          acc[result.userId] = result.data
          return acc
        },
        {} as Record<number, TeacherPerformance>,
      )

      setPerformance(performanceMap)
      setLoading(false)
    }

    fetchData()
  }, [selectedSemester]) // ✨ 4. 의존성 배열에 selectedSemester 추가

  const groupedTeachers = useMemo(() => {
    return teachers.reduce(
      (acc, teacher) => {
        const type = teacher.is_foreign ? '원어민 선생님' : '한국인 선생님'
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(teacher)
        return acc
      },
      {} as Record<string, User[]>,
    )
  }, [teachers])

  if (loading) {
    return (
      <div className="py-8">
        <Loading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedTeachers).map(([groupTitle, teacherList]) => (
        <div key={groupTitle}>
          <h3 className="text-xl font-bold mb-3 text-gray-800">{groupTitle}</h3>
          <div className="flex gap-4 pb-4 overflow-x-auto">
            {teacherList.map(teacher => (
              <SimpleTeacherCard
                key={teacher.user_id}
                user={teacher}
                classRate={performance[teacher.user_id]?.classRate}
                subjectRate={performance[teacher.user_id]?.subjectRate}
                classStudentCount={performance[teacher.user_id]?.classStudentCount} // ✨ 추가
                subjectStudentCount={performance[teacher.user_id]?.subjectStudentCount} // ✨ 추가
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// src/pages/Teachers/TeacherDetail.tsx
import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserDetail, getAssignedSubjects } from '../../api/user.api'
import { getStudentsInClass } from '../../api/classStudent.api'
import { getStudentSubjectProgress } from '../../api/report.api'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import type { User, AssignedSubject } from '../../types/user'
import type { StudentSubjectProgressReport } from '../../types/report'
import type { Student } from '../../types/student'
import Loading from '../../components/ui/Loading'
import StyledTabs from '../../components/ui/StyledTabs'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
// import ProgressDisplay from '../../components/dashboard/ProgressDisplay' // ✨ 삭제: 사용하지 않으므로 제거
import { Badge } from '../../components/ui/Badge'
import { getAllClasses } from '../../api/class.api' // ✨ 추가
import type { ClassItem } from '../../types/class' // ✨ 추가

interface StudentWithProgress {
  student_id: number
  student_name: string
  completion_rate: number
}

interface SubjectWithStudents {
  subject_id: number
  subject_name: string
  overall_completion_rate: number
  low_progress_student_count: number
  students: StudentWithProgress[]
}

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedSemester, setTitle, setDescription, setActions, setEntityName } = usePageHeader()

  const [teacher, setTeacher] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([])
  const [allClassesInSemester, setAllClassesInSemester] = useState<ClassItem[]>([])
  const [allStudentsInClasses, setAllStudentsInClasses] = useState<Student[]>([])
  const [studentProgress, setStudentProgress] = useState<
    Record<number, StudentSubjectProgressReport[]>
  >({})

  useEffect(() => {
    if (teacher && setEntityName) {
      setEntityName(`${teacher.username}`)
    }
    return () => {
      if (setEntityName) setEntityName(undefined)
    }
  }, [teacher, setEntityName])

  useEffect(() => {
    if (teacher) {
      setTitle(`${teacher.username} (${teacher.name})`)
      setDescription('담당 반과 과목의 숙제 성취도를 확인합니다.')
      setActions(
        <Button variant="outline" onClick={() => navigate(-1)}>
          목록으로 돌아가기
        </Button>,
      )
    }
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [teacher, setTitle, setDescription, setActions, navigate])

  useEffect(() => {
    const teacherId = Number(id)
    if (isNaN(teacherId) || !selectedSemester) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [teacherData, assignedSubjectsData, allClassesData] = await Promise.all([
          getUserDetail(teacherId, 1),
          getAssignedSubjects(teacherId, selectedSemester.semester_id),
          getAllClasses({ semester_id: selectedSemester.semester_id }),
        ])
        setTeacher(teacherData)
        setAssignedSubjects(assignedSubjectsData)
        setAllClassesInSemester(allClassesData)

        const classIds = [...new Set(assignedSubjectsData.map(s => s.class_id))]
        const studentsInClassesPromises = classIds.map(cid => getStudentsInClass(cid))
        const studentsInClassesArrays = await Promise.all(studentsInClassesPromises)
        const allStudents = studentsInClassesArrays.flat()
        setAllStudentsInClasses(allStudents)
        const uniqueStudentIds = [...new Set(allStudents.map(s => s.student_id))]

        const studentProgressPromises = uniqueStudentIds.map(sid => getStudentSubjectProgress(sid))
        const allStudentProgress = await Promise.all(studentProgressPromises)

        const progressMap: Record<number, StudentSubjectProgressReport[]> = {}
        uniqueStudentIds.forEach((sid, index) => {
          progressMap[sid] = allStudentProgress[index]
        })
        setStudentProgress(progressMap)
      } catch (err) {
        setError('교사 상세 정보를 불러오는 데 실패했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, selectedSemester])

  const homeroomClassesData = useMemo(() => {
    if (!teacher) return []

    const teacherHomeroomClasses = allClassesInSemester.filter(
      cls => cls.kr_homeroom_id === teacher.user_id || cls.fr_homeroom_id === teacher.user_id,
    )

    return teacherHomeroomClasses.map(classItem => {
      const classId = classItem.class_id

      const studentIdsInClass = new Set(
        allStudentsInClasses
          .filter(student => studentProgress[student.student_id]?.some(p => p.class_id === classId))
          .map(s => s.student_id),
      )

      const allProgressInClass = Array.from(studentIdsInClass)
        .flatMap(sid => studentProgress[sid] || [])
        .filter(p => p.class_id === classId)

      const subjectsInClass = [...new Set(allProgressInClass.map(p => p.subject_name))]

      const subjectsWithProgress = subjectsInClass.map(subjectName => {
        const progressForSubject = allProgressInClass.filter(p => p.subject_name === subjectName)
        const totalRate = progressForSubject.reduce((sum, p) => sum + p.completion_rate, 0)
        const avgRate = progressForSubject.length > 0 ? totalRate / progressForSubject.length : 0
        return { subject_name: subjectName, completion_rate: avgRate }
      })

      const overallRate =
        allProgressInClass.reduce((sum, p) => sum + p.completion_rate, 0) /
        (allProgressInClass.length || 1)

      // ✨ 수정: allProgressInClass에는 student_id가 없으므로, studentIdsInClass를 기준으로 필터링합니다.
      const studentsBelow70 = new Set(
        Array.from(studentIdsInClass).filter(studentId => {
          const progresses = studentProgress[studentId]?.filter(p => p.class_id === classId)
          if (!progresses || progresses.length === 0) return false
          const avgRate =
            progresses.reduce((sum, p) => sum + p.completion_rate, 0) / progresses.length
          return avgRate > 0 && avgRate < 70
        }),
      )

      return {
        class_id: classId,
        class_name: classItem.class_name,
        overall_completion_rate: overallRate,
        low_progress_student_count: studentsBelow70.size,
        total_student_count: studentIdsInClass.size,
        subjects: subjectsWithProgress,
      }
    })
  }, [teacher, allClassesInSemester, studentProgress, allStudentsInClasses])

  const assignedClassesAndSubjectsData = useMemo(() => {
    // ✨ grouped 객체의 타입을 명확히 지정합니다.
    const grouped: Record<string, { class_id: number; subjects: SubjectWithStudents[] }> = {}

    assignedSubjects.forEach(as => {
      if (!grouped[as.class_name]) {
        grouped[as.class_name] = { class_id: as.class_id, subjects: [] }
      }

      const studentsForSubject: StudentWithProgress[] = allStudentsInClasses
        .filter(student =>
          studentProgress[student.student_id]?.some(
            p => p.class_id === as.class_id && p.subject_id === as.subject_id,
          ),
        )
        .map(student => {
          const progress = studentProgress[student.student_id]?.find(
            p => p.class_id === as.class_id && p.subject_id === as.subject_id,
          )
          return {
            student_id: student.student_id,
            student_name: student.student_name,
            completion_rate: progress?.completion_rate ?? 0,
          }
        })

      const totalRate = studentsForSubject.reduce((sum, s) => sum + s.completion_rate, 0)
      const avgRate = studentsForSubject.length > 0 ? totalRate / studentsForSubject.length : 0
      const studentsBelow70 = studentsForSubject.filter(
        s => s.completion_rate > 0 && s.completion_rate < 70,
      )

      grouped[as.class_name].subjects.push({
        subject_id: as.subject_id,
        subject_name: as.subject_name,
        overall_completion_rate: avgRate,
        low_progress_student_count: studentsBelow70.length,
        students: studentsForSubject,
      })
    })

    return Object.entries(grouped)
  }, [assignedSubjects, studentProgress, allStudentsInClasses])

  if (loading) return <Loading />
  if (error) return <div className="text-red-600 text-center p-8">{error}</div>
  if (!teacher) return <div className="text-center p-8">교사 정보를 찾을 수 없습니다.</div>

  const tabs = [
    {
      id: 'classes',
      label: `담당 반 (${homeroomClassesData.length})`,
      content: (
        <div className="space-y-4">
          {homeroomClassesData.length > 0 ? (
            homeroomClassesData.map(classData => (
              <Card
                key={classData.class_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/classes/${classData.class_id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{classData.class_name}</h3>
                      <p className="text-xs text-gray-500">
                        관리필요 {classData.low_progress_student_count}명 / 전체{' '}
                        {classData.total_student_count}명
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">전체 숙제 진척도</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {classData.overall_completion_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">과목별 숙제 진척도</h4>
                    <ul className="space-y-2">
                      {classData.subjects.map(subject => (
                        <li
                          key={subject.subject_name}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-800">{subject.subject_name}</span>
                          <span className="font-medium text-gray-700">
                            {subject.completion_rate.toFixed(1)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">담당하고 있는 반이 없습니다.</p>
          )}
        </div>
      ),
    },
    {
      id: 'sessions',
      label: `담당 과목 (${assignedSubjects.length})`,
      content: (
        <div className="space-y-6">
          {assignedClassesAndSubjectsData.length > 0 ? (
            assignedClassesAndSubjectsData.map(([className, classData]) => (
              <div key={className}>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{className}</h3>
                <div className="space-y-4">
                  {classData.subjects.map(subject => (
                    <Card key={subject.subject_id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-md font-bold">{subject.subject_name}</h4>
                            <p className="text-xs text-gray-500">
                              관리필요 {subject.low_progress_student_count}명 / 전체{' '}
                              {subject.students.length}명
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">과목별 숙제 진척도</p>
                            <p className="text-xl font-bold text-green-600">
                              {subject.overall_completion_rate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">
                            학생별 숙제 진척도
                          </h4>
                          <ul className="space-y-2">
                            {subject.students.map((student: StudentWithProgress) => (
                              <li
                                key={student.student_id}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-800">{student.student_name}</span>
                                <Badge tone={student.completion_rate < 70 ? 'danger' : 'success'}>
                                  {student.completion_rate.toFixed(1)}%
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">담당하고 있는 과목이 없습니다.</p>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <StyledTabs tabs={tabs} defaultTabId="classes" />
        </CardContent>
      </Card>
    </div>
  )
}

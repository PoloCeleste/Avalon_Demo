// src/pages/Classes/ClassList.tsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { getAllClasses, generateClassSessions, getClassById } from '../../api/class.api'
import { getStudentsInClass } from '../../api/classStudent.api'
import { getStudentSubjectProgress } from '../../api/report.api'
import { getAllUsers } from '../../api/user.api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import type { ClassItem } from '../../types/class'
import type { User } from '../../types/user'
import Loading from '../../components/ui/Loading'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import { Badge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

// 각 과목의 상세 정보를 담을 타입
interface SubjectDetailWithProgress {
  subject_id: number
  subject_name: string
  teacher_name: string
  completion_rate: number
}

const ClassList = () => {
  const navigate = useNavigate()
  const { setTitle, setDescription, setActions, selectedSemester } = usePageHeader()

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 각 반의 과목별 상세 데이터를 저장할 state
  const [classDetails, setClassDetails] = useState<Record<number, SubjectDetailWithProgress[]>>({})
  const [detailsLoading, setDetailsLoading] = useState<Record<number, boolean>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [classToActivate, setClassToActivate] = useState<number | null>(null)

  useEffect(() => {
    setTitle('반 목록')
    setDescription('등록된 반 목록을 확인하고 관리합니다.')
    setActions(<Button onClick={() => navigate('/classes/new')}>새 반 생성</Button>)
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions, navigate])

  // 1. 반 목록과 전체 사용자 목록을 먼저 불러옵니다.
  const fetchClassesAndUsers = useCallback(async () => {
    if (!selectedSemester) {
      setClasses([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [classesData, usersData] = await Promise.all([
        getAllClasses({ semester_id: selectedSemester.semester_id }),
        getAllUsers(),
      ])
      setClasses(classesData)
      setUsers(usersData)
    } catch (err) {
      setError('반 또는 사용자 목록을 불러오는 데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedSemester])

  useEffect(() => {
    fetchClassesAndUsers()
  }, [fetchClassesAndUsers])

  // 2. 반 목록과 사용자 목록이 로드되면, 각 반의 상세 정보를 조합하여 가져옵니다.
  useEffect(() => {
    // 클래스나 유저 정보가 없으면 실행하지 않음
    if (classes.length === 0 || users.length === 0) return

    classes.forEach(async classItem => {
      setDetailsLoading(prev => ({ ...prev, [classItem.class_id]: true }))
      try {
        const students = await getStudentsInClass(classItem.class_id)
        if (students.length === 0) {
          setClassDetails(prev => ({ ...prev, [classItem.class_id]: [] }))
          return
        }

        const studentProgressPromises = students.map(student =>
          getStudentSubjectProgress(student.student_id),
        )
        const allStudentProgress = await Promise.all(studentProgressPromises)

        const progressBySubject: Record<
          number,
          { rates: number[]; teacher: string; name: string }
        > = {}

        allStudentProgress.flat().forEach(progress => {
          if (progress.class_id === classItem.class_id) {
            if (!progressBySubject[progress.subject_id]) {
              progressBySubject[progress.subject_id] = {
                rates: [],
                teacher: progress.teacher_name, // API에서 받은 한글 이름 우선 저장
                name: progress.subject_name,
              }
            }
            progressBySubject[progress.subject_id].rates.push(progress.completion_rate)
          }
        })

        const finalDetails: SubjectDetailWithProgress[] = Object.entries(progressBySubject).map(
          ([subjectId, data]) => {
            const avgRate = data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length

            // users 배열에서 한글 이름(data.teacher)으로 교사를 찾아 영어 이름(username)으로 교체
            const teacherUser = users.find(u => u.name === data.teacher)
            const displayTeacherName = teacherUser?.username || data.teacher // 없으면 원래 한글 이름 사용

            return {
              subject_id: Number(subjectId),
              subject_name: data.name,
              teacher_name: displayTeacherName, // 교체된 이름으로 설정
              completion_rate: avgRate,
            }
          },
        )

        setClassDetails(prev => ({ ...prev, [classItem.class_id]: finalDetails }))
      } catch (err) {
        console.error(`Failed to fetch details for class ${classItem.class_id}`, err)
        setClassDetails(prev => ({ ...prev, [classItem.class_id]: [] }))
      } finally {
        setDetailsLoading(prev => ({ ...prev, [classItem.class_id]: false }))
      }
    })
  }, [classes, users]) // users 배열이 변경될 때도 이 effect가 실행되도록 추가

  // 반 활성화 로직 (기존 코드 유지)
  const handleActivationRequest = (classId: number) => {
    setClassToActivate(classId)
    setIsModalOpen(true)
  }

  const handleConfirmActivation = async () => {
    if (!classToActivate) return
    try {
      const classDetails = await getClassById(classToActivate)
      if (classDetails && classDetails.schedule_details_json) {
        const testSchedules = classDetails.schedule_details_json.map(detail => ({
          class_id: classToActivate,
          subject_id: detail.subject_id ?? 0,
          test_title: '정기 시험',
          test_day: '2025-10-15',
          classtime_ids: detail.classtime_id ? [detail.classtime_id] : [],
        }))
        await generateClassSessions(classToActivate, testSchedules)
      }
      const updatedClass = await getClassById(classToActivate)
      setClasses(prevClasses =>
        prevClasses.map(c => (c.class_id === classToActivate ? updatedClass : c)),
      )
      alert('반이 활성화되고 세션 생성이 시작되었습니다.')
    } catch (err) {
      console.error('반 활성화 또는 세션 생성 실패:', err)
      alert('상태 변경에 실패했습니다.')
    } finally {
      setIsModalOpen(false)
      setClassToActivate(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loading />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!selectedSemester ? (
          <p className="col-span-full text-center text-gray-500">
            먼저 상단에서 학기를 선택해주세요.
          </p>
        ) : classes.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            해당 학기에 등록된 반이 없습니다.
          </p>
        ) : (
          classes.map(classItem => {
            const subjectDetails = classDetails[classItem.class_id]
            const isLoadingDetails = detailsLoading[classItem.class_id] ?? true

            const krTeacher = users.find(u => u.user_id === classItem.kr_homeroom_id)
            const frTeacher = users.find(u => u.user_id === classItem.fr_homeroom_id)

            return (
              <Card
                key={classItem.class_id}
                className={`flex flex-col max-w-full transition-colors ${
                  !classItem.is_active ? 'border-gray-200 bg-gray-50' : 'hover:shadow-md'
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  {' '}
                  {/* pb-2로 하단 패딩 감소 */}
                  <div>
                    <CardTitle className={`${!classItem.is_active ? 'text-gray-400' : ''}`}>
                      {classItem.class_name}
                    </CardTitle>
                  </div>
                  {classItem.is_active ? (
                    <Badge tone="success">활성</Badge>
                  ) : (
                    <ConfirmButton
                      isConfirmed={classItem.is_active}
                      onConfirm={() => handleActivationRequest(classItem.class_id)}
                    >
                      활성화
                    </ConfirmButton>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-grow items-start space-y-4 pt-2">
                  {' '}
                  {/* pt-2로 상단 패딩 감소 */}
                  {/* ✨ 담임 정보와 과목 현황을 CardContent 안으로 이동 및 재구성 */}
                  <div className="w-full space-y-3">
                    {/* 담임 정보 박스 */}
                    <div className="flex items-stretch gap-2">
                      {' '}
                      {/* items-stretch 추가로 높이를 맞춤 */}
                      <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-lg p-2 text-center">
                        <p className="text-xs font-semibold text-blue-700">한국인 담임</p>
                        <p className="font-bold text-blue-800 text-base mt-1">
                          {krTeacher?.username || '미지정'}
                        </p>
                      </div>
                      <div className="flex-1 bg-green-50/50 border border-green-100 rounded-lg p-2 text-center">
                        <p className="text-xs font-semibold text-green-700">원어민 담임</p>
                        <p className="font-bold text-green-800 text-base mt-1">
                          {frTeacher?.username || '미지정'}
                        </p>
                      </div>
                    </div>

                    {/* 과목별 현황 */}
                    {isLoadingDetails ? (
                      <div className="text-center text-xs text-gray-400 w-full py-8">
                        상세 정보 로딩 중...
                      </div>
                    ) : subjectDetails && subjectDetails.length > 0 ? (
                      <div className="w-full border-t pt-3">
                        <h4 className="text-xs font-semibold text-gray-600 mb-2">과목별 현황</h4>
                        <ul className="space-y-2 text-sm">
                          {subjectDetails.map(subject => (
                            <li
                              key={subject.subject_id}
                              className="flex justify-between items-center"
                            >
                              <p>
                                <span className="font-medium text-gray-800">
                                  {subject.subject_name}
                                </span>
                                <span className="text-gray-500 ml-2">({subject.teacher_name})</span>
                              </p>
                              <span className="font-bold text-blue-600">
                                {subject.completion_rate.toFixed(1)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-gray-400 w-full py-8">
                        표시할 수업 정보가 없습니다.
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => navigate(`/classes/${classItem.class_id}`)}
                    size="sm"
                    variant="outline"
                    className="mt-auto"
                  >
                    상세 보기
                  </Button>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="반 활성화 확인"
        description="활성화 전 반드시 확인해주세요."
      >
        <div>
          <p className="text-sm text-gray-600 mb-4">
            활성화 시에는, 반의 수업 정보를 수정할 수 없습니다.
            <br />
            시험 정보와 스케줄을 확인하셨나요?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmActivation}>확인</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ClassList

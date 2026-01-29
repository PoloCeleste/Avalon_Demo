import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getStudentById, updateStudent } from '../../api/student.api'
import { getClassesForStudent } from '../../api/classStudent.api'
import { getStudentSubjectProgress } from '../../api/report.api' // 성과 API import
import { usePageHeader } from '../../contexts/PageHeaderContext'
import type { Student, UpdateStudentRequest, StudentStatus } from '../../types/student'
import type { StudentClassInfo } from '../../types/class'
import type { StudentSubjectProgressReport } from '../../types/report' // 성과 타입 import
import { ROLES } from '../../utils/roles'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading'
import { Label } from '../../components/ui/Label'
import { Select } from '../../components/ui/Select'
import StyledTabs from '../../components/ui/StyledTabs'
import OverallProgressCard from '../../components/dashboard/OverallProgressCard' // Progress 카드 import
import { getAllSubjects } from '../../api/subject.api'
import type { Subject } from '../../types/subject'
import { getAllUsers } from '../../api/user.api'
import { getAllSemesters } from '../../api/semester.api'
import type { User } from '../../types/user'
import type { Semester } from '../../types/semester'
import { Progress } from '../../components/ui/Progress' // Progress 컴포넌트 import

export default function StudentDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { setTitle, setDescription, setActions, setEntityName } = usePageHeader()

  const [student, setStudent] = useState<Student | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<UpdateStudentRequest>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [studentClasses, setStudentClasses] = useState<StudentClassInfo[]>([])
  const [users, setUsers] = useState<User[]>([]) // ✨ 추가
  const [semesters, setSemesters] = useState<Semester[]>([]) // ✨ 추가
  const [subjects, setSubjects] = useState<Subject[]>([]) // ✨ 이 줄을 추가하세요
  // const [homeworkReport, setHomeworkReport] = useState<StudentWeeklyHomeworkReport | null>(null);
  const [cumulativeReport, setCumulativeReport] = useState<{
    total_homework_count: number
    completed_homework_count: number
    completion_rate: number
  } | null>(null)
  const [subjectProgress, setSubjectProgress] = useState<StudentSubjectProgressReport[]>([]) // ✨ 추가

  useEffect(() => {
    if (subjectProgress && subjectProgress.length > 0) {
      const total = subjectProgress.reduce((acc, cur) => acc + (cur.subject_total || 0), 0)
      const completed = subjectProgress.reduce((acc, cur) => acc + (cur.subject_completed || 0), 0)
      setCumulativeReport({
        total_homework_count: total,
        completed_homework_count: completed,
        completion_rate: total > 0 ? (completed / total) * 100 : 0,
      })
    }
  }, [subjectProgress])

  const groupedClasses = useMemo(() => {
    return studentClasses.map(classItem => {
      const subjectIds = new Set(
        (classItem.schedule_details_json || [])
          .map(detail => detail.subject_id)
          .filter((id): id is number => id !== undefined),
      )

      // ✨ 과목 이름만 반환하는 대신, ID와 이름을 함께 가진 객체 배열을 생성합니다.
      const subjectsData = Array.from(subjectIds).map(id => {
        const subject = subjects.find((s: Subject) => s.subject_id === id)
        return {
          subject_id: id,
          subject_name: subject ? subject.subject_name : '알 수 없는 과목',
        }
      })

      return {
        ...classItem,
        subjects: subjectsData, // subjects는 이제 { subject_id, subject_name } 객체의 배열입니다.
      }
    })
  }, [studentClasses, subjects])

  const gradeOptions = [
    { value: '', label: '학년 선택' },
    { value: '1', label: '유치부 5세' },
    { value: '2', label: '유치부 6세' },
    { value: '3', label: '유치부 7세' },
    { value: '4', label: '초등학교 1학년' },
    { value: '5', label: '초등학교 2학년' },
    { value: '6', label: '초등학교 3학년' },
    { value: '7', label: '초등학교 4학년' },
    { value: '8', label: '초등학교 5학년' },
    { value: '9', label: '초등학교 6학년' },
    { value: '10', label: '중학교 1학년' },
    { value: '11', label: '중학교 2학년' },
    { value: '12', label: '중학교 3학년' },
    { value: '13', label: '고등학교 1학년' },
    { value: '14', label: '고등학교 2학년' },
    { value: '15', label: '고등학교 3학년' },
  ]

  const canEdit =
    user &&
    (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN || user.role === ROLES.MANAGER)

  const startEdit = useCallback(() => setEditMode(true), [])

  const cancelEdit = useCallback(() => {
    if (student) {
      setForm({
        english_name: student.english_name,
        student_phone: student.student_phone,
        parent_phone: student.parent_phone,
        school: student.school,
        s_year: student.s_year,
        birthday: student.birthday,
        status: student.status,
      })
    }
    setEditMode(false)
  }, [student])

  const handleSave = useCallback(async () => {
    if (!user || !canEdit || !id) return

    try {
      setLoading(true)
      setMessage(null)
      setError(null)

      const updatePayload: UpdateStudentRequest = {
        ...form,
        birthday: form.birthday || undefined,
      }

      const updatedStudent = await updateStudent(Number(id), updatePayload)
      setStudent(prev => (prev ? { ...prev, ...updatedStudent } : null))
      setMessage('학생 정보가 성공적으로 저장되었습니다.')
      setEditMode(false)
    } catch (err) {
      setError('학생 정보 저장에 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, canEdit, id, form])

  useEffect(() => {
    if (student) {
      setTitle(student.student_name || student.english_name || '학생 상세')
      setDescription(`${student.student_name} 학생의 상세 정보를 확인하고 관리할 수 있습니다`)
      setActions(
        <Button variant="outline" onClick={() => navigate('/students')}>
          목록으로 돌아가기
        </Button>,
      )
      if (setEntityName) setEntityName(student.student_name || student.english_name)
    }

    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
      if (setEntityName) setEntityName(undefined)
    }
  }, [student, navigate, setTitle, setDescription, setActions, setEntityName])

  // 변경점: class.ts 타입에 맞게 숫자를 받는 함수로 수정
  // const getDayOfWeek = (dayNumber: number | undefined) => {
  //   if (dayNumber === undefined) return '-'
  //   const days = ['월', '화', '수', '목', '금', '토', '일']
  //   return days[dayNumber - 1] || '-'
  // }

  useEffect(() => {
    const fetchStudentDetail = async () => {
      if (id) {
        try {
          setLoading(true)
          const studentId = Number(id)

          const [
            studentData,
            classesData,
            subjectsData,
            usersData,
            semestersData,
            subjectProgressData,
          ] = await Promise.all([
            getStudentById(studentId),
            getClassesForStudent(studentId),
            getAllSubjects(),
            getAllUsers(), // ✨ 추가
            getAllSemesters(), // ✨ 추가
            getStudentSubjectProgress(studentId), // ✨ 추가
          ])

          setStudent(studentData)
          setForm({
            english_name: studentData.english_name,
            student_phone: studentData.student_phone,
            parent_phone: studentData.parent_phone,
            school: studentData.school,
            s_year: studentData.s_year,
            birthday: studentData.birthday,
            status: studentData.status,
          })
          setStudentClasses(classesData)
          setSubjects(subjectsData)
          setUsers(usersData) // ✨ 추가
          setSemesters(semestersData) // ✨ 추가
          setSubjectProgress(subjectProgressData) // ✨ 추가
        } catch (err) {
          setError('학생 정보를 불러오지 못했습니다.')
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchStudentDetail()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const getStatusDisplayName = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '재학'
      case 'ON_LEAVE':
        return '휴학'
      case 'WITHDRAWN':
        return '졸업'
      case 'DELETED':
        return '삭제됨'
      default:
        return status
    }
  }

  const getBadgeToneForStatus = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success'
      case 'ON_LEAVE':
        return 'warning'
      case 'WITHDRAWN':
        return 'info'
      case 'DELETED':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  if (loading) return <Loading />
  if (error && !student) return <div className="p-6 text-red-600">{error}</div>
  if (!student) return <div className="p-6">학생 정보를 찾을 수 없습니다.</div>

  const tabs = [
    {
      id: 'basic-info',
      label: '기본 정보',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측 프로필 요약 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-green-700">
                {student.student_name?.[0] || student.english_name?.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900">
                {student.student_name} ({student.english_name})
              </h3>
              <div className="space-y-2 mt-3">
                <Badge tone="success">학생</Badge>
                <br />
                <Badge tone={getBadgeToneForStatus(student.status)}>
                  {getStatusDisplayName(student.status)}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-gray-600 pt-4 border-t w-full text-center">
              <p>
                등록일:{' '}
                {student.created_at ? new Date(student.created_at).toLocaleDateString() : '-'}
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-2 pt-4">
                {!editMode ? (
                  <Button onClick={startEdit}>정보 수정</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={cancelEdit}>
                      취소
                    </Button>
                    <Button onClick={handleSave}>저장</Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 우측 정보 입력 필드 */}
          <div className="space-y-4">
            <Input
              label="영어 이름"
              name="english_name"
              value={editMode ? form.english_name : student.english_name || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="전화번호"
              name="student_phone"
              value={editMode ? form.student_phone : student.student_phone || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="학부모 연락처"
              name="parent_phone"
              value={editMode ? form.parent_phone : student.parent_phone || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="생년월일"
              name="birthday"
              type={student.birthday ? 'date' : editMode ? 'date' : 'text'}
              value={editMode ? form.birthday : student.birthday || '-'}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="학교명"
              name="school"
              value={editMode ? form.school : student.school || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <div>
              <Label htmlFor="s_year">학년</Label>
              {editMode ? (
                <Select
                  label="학년"
                  options={gradeOptions}
                  name="s_year"
                  value={String(form.s_year)}
                  onChange={handleChange}
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900 h-9 flex items-center px-3 bg-gray-50 border border-gray-300 rounded-md">
                  {gradeOptions.find(option => Number(option.value) === student.s_year)?.label ||
                    student.s_year}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="status">상태</Label>
              {editMode ? (
                <Select
                  label="상태"
                  options={[
                    { value: 'ACTIVE', label: '재학' },
                    { value: 'ON_LEAVE', label: '휴학' },
                    { value: 'WITHDRAWN', label: '졸업' },
                    { value: 'DELETED', label: '삭제됨' },
                  ]}
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                />
              ) : (
                <div className="h-9 flex items-center">
                  <Badge tone={getBadgeToneForStatus(student.status)}>
                    {getStatusDisplayName(student.status)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'enrollment-info',
      label: '수강 정보',
      content: (
        <div className="space-y-6">
          {/* ✨ 새로운 누적 숙제 성취도 카드로 변경 */}
          {cumulativeReport ? (
            <OverallProgressCard
              title="누적 숙제 성취도"
              description="오늘까지 마감인 모든 과제에 대한 종합적인 진척도입니다."
              averageCompletion={cumulativeReport.completion_rate}
              completedCount={cumulativeReport.completed_homework_count}
              totalCount={cumulativeReport.total_homework_count}
            />
          ) : (
            // 데이터가 로드되는 동안 보일 카드
            <Card>
              <CardHeader title="누적 숙제 성취도" />
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>데이터를 불러오는 중입니다...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 수강 목록 카드는 그대로 유지 */}
          <Card>
            <CardHeader title="수강 목록" subtitle="학생이 수강 중인 반과 관련 정보를 확인합니다" />
            <CardContent>
              {groupedClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedClasses.map(classInfo => {
                    // ID로 선생님 이름을 찾는 헬퍼 함수
                    const getTeacherNameById = (id: number | null | undefined) => {
                      if (!id) return '-'
                      const teacher = users.find((u: User) => u.user_id === id)
                      if (!teacher) return '미지정'

                      // 영어 이름(username)을 기본으로 표시하고, 만약 없다면 한국어 이름(name)을 표시합니다.
                      return teacher.username || teacher.name
                    }

                    // ID로 학기 이름을 찾는 로직
                    const semesterName = semesters.find(
                      s => s.semester_id === classInfo.semester_id,
                    )?.semester_name

                    return (
                      <div key={classInfo.class_id} className="flex flex-col p-4 border rounded-lg">
                        <div className="pb-2 border-b">
                          <p className="font-bold text-lg">{classInfo.class_name}</p>
                          {/* 'semester_name' does not exist 에러 해결 */}
                          <p className="text-sm text-gray-500">
                            {semesterName || '학기 정보 없음'}
                          </p>
                        </div>

                        <div className="py-3 border-b">
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">담당</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">한국인 담임:</span>
                              <span className="font-medium text-gray-800">
                                {getTeacherNameById(classInfo.kr_homeroom_id)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">원어민 담임:</span>
                              <span className="font-medium text-gray-800">
                                {getTeacherNameById(classInfo.fr_homeroom_id)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 flex-grow">
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">
                            수강 과목 및 진척도
                          </h4>
                          {classInfo.subjects.length > 0 ? (
                            <div className="space-y-4">
                              {classInfo.subjects.map((subject, idx) => {
                                // 해당 반(class)과 과목(subject)에 맞는 진척도(progress) 데이터를 찾습니다.
                                const progress = subjectProgress.find(
                                  p =>
                                    p.class_id === classInfo.class_id &&
                                    p.subject_id === subject.subject_id,
                                )

                                return (
                                  <div key={idx}>
                                    <div className="flex justify-between items-center text-sm mb-1">
                                      <p>
                                        <span className="font-medium text-gray-800">
                                          {subject.subject_name}
                                        </span>
                                        <span className="text-gray-500 ml-2">
                                          ({progress?.teacher_name || '미배정'})
                                        </span>
                                      </p>
                                      <span className="font-bold text-blue-600">
                                        {progress?.completion_rate?.toFixed(1) ?? 'N/A'}%
                                      </span>
                                    </div>
                                    {/* Progress 컴포넌트가 준비되어 있어야 합니다. */}
                                    <Progress
                                      value={progress?.completion_rate || 0}
                                      className="h-2"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">배정된 과목 정보가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>등록된 수강 정보가 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {(error || message) && (
        <div
          className={`p-4 rounded-lg ${
            error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
          }`}
        >
          <p className={`text-sm ${error ? 'text-red-800' : 'text-green-800'}`}>
            {error || message}
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <StyledTabs tabs={tabs} defaultTabId="basic-info" />
        </CardContent>
      </Card>
    </div>
  )
}

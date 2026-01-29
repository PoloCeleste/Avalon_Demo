import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading'
import { getClassById, updateClass, deleteClass } from '../../api/class.api'
import { getAllUsers } from '../../api/user.api'
import { getAllCurriculums } from '../../api/curriculum.api'
import type { Curriculum } from '../../types/curriculum'
import type { User } from '../../types/user'
import { Label } from '../../components/ui/Label'
import { Select } from '../../components/ui/Select'
import StyledTabs from '../../components/ui/StyledTabs'
import { getAllSubjects } from '../../api/subject.api'
import type { Subject } from '../../types/subject'
import * as holidayApi from '../../api/holiday.api'
import type { Holiday } from '../../types/holiday'
import type { ClassItem, UpdateClassRequest, ScheduleDetail } from '../../types/class'
import { getAllClasstimes } from '../../api/classtime.api'
import type { Classtime } from '../../types/classtime'
import { getAllStudents } from '../../api/student.api'
import {
  assignStudentsToClass,
  getStudentsInClass,
  removeStudentFromClass,
} from '../../api/classStudent.api'
import { getClassHomeworkProgressReport } from '../../api/report.api'
import type { ClassHomeworkProgressReport } from '../../types/report'
// import HomeworkProgressCard from '../../components/page/HomeworkProgressCard'
import StudentCard from '../../components/students/StudentCard' // ✨ 새로 만든 카드 import
import type { Student } from '../../types/student'
import Modal from '../../components/ui/Modal'
import { Checkbox } from '../../components/ui/Checkbox'
import { Input } from '../../components/ui/Input'
// import { deleteClass } from '../../api/class.api'
import { useAuthStore } from '../../store/authStore'
import { ADMINISH, type Role } from '../../utils/roles'
// 변경점: updateTest, deleteTest API 함수 import 추가
import { getAllTests, createTest, updateTest, deleteTest } from '../../api/test.api'
import type { Test, CreateTestRequest } from '../../types/test'
import { getAllCurriculumDetails } from '../../api/curriculumDetail.api'
import type { CurriculumDetail } from '../../types/curriculumDetail'
import { getStudentSubjectProgress } from '../../api/report.api'
import type { StudentSubjectProgressReport } from '../../types/report'

// 날짜 유틸리티 함수
const getStartOfWeek = (date: Date) => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

const addDays = (date: Date, days: number) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const daysOfWeek = [
  { value: 'Mon', label: '월' },
  { value: 'Tue', label: '화' },
  { value: 'Wed', label: '수' },
  { value: 'Thu', label: '목' },
  { value: 'Fri', label: '금' },
]

export default function ClassDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setTitle, setDescription, setActions, setEntityName, selectedSemester } = usePageHeader()

  const [classInfo, setClassInfo] = useState<ClassItem | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab] = useState('class-info')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [classtimes, setClasstimes] = useState<Classtime[]>([])
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [draftSelectedIds, setDraftSelectedIds] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<UpdateClassRequest>({})
  const [tests, setTests] = useState<Test[]>([])
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newTestInfo, setNewTestInfo] = useState<Partial<CreateTestRequest>>({})
  const [isTestRegistrationMode, setIsTestRegistrationMode] = useState(false)
  const [curriculumDetails, setCurriculumDetails] = useState<CurriculumDetail[]>([])
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [homeworkProgress, setHomeworkProgress] = useState<ClassHomeworkProgressReport | null>(null)
  const [studentSubjectProgress, setStudentSubjectProgress] = useState<
    Record<number, StudentSubjectProgressReport[]>
  >({}) // ✨ 추가

  const canEdit = user && ADMINISH.includes(user.role as Role)

  const startEdit = useCallback(() => setEditMode(true), [])

  const cancelEdit = useCallback(() => {
    if (classInfo) {
      setForm({
        class_name: classInfo.class_name,
        is_active: classInfo.is_active,
      })
    }
    setEditMode(false)
  }, [classInfo])

  const handleSave = useCallback(async () => {
    if (!id) return
    try {
      const updatedClass = await updateClass(Number(id), form)
      setClassInfo(updatedClass)
      setEditMode(false)
    } catch (err) {
      console.error('Failed to update class:', err)
      setError('반 정보 수정에 실패했습니다.')
    }
  }, [id, form])

  const handleDelete = useCallback(async () => {
    if (!id || !classInfo || classInfo.is_active) return

    if (
      window.confirm(
        `정말로 '${classInfo.class_name}' 반을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      try {
        await deleteClass(Number(id))
        alert('반이 성공적으로 삭제되었습니다.')
        navigate('/classes')
      } catch (err) {
        console.error('Failed to delete class:', err)
        let errorMessage = '반 삭제에 실패했습니다.'
        if (isAxiosError(err) && err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        }
        setError(errorMessage)
        alert(errorMessage)
      }
    }
  }, [id, classInfo, navigate])

  useEffect(() => {
    if (classInfo) {
      setTitle(classInfo.class_name)
      setDescription(`${classInfo.class_name}의 상세 정보와 수강생을 관리할 수 있습니다`)
      setActions(
        <>
          <Button variant="outline" onClick={() => navigate('/classes')}>
            목록으로
          </Button>
          {canEdit && !classInfo.is_active && (
            <Button variant="destructive" onClick={handleDelete}>
              반 삭제
            </Button>
          )}
        </>,
      )
      if (setEntityName) setEntityName(classInfo.class_name)
    }
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
      if (setEntityName) setEntityName(undefined)
    }
  }, [
    classInfo,
    navigate,
    setTitle,
    setDescription,
    setActions,
    setEntityName,
    canEdit,
    handleDelete,
  ])

  useEffect(() => {
    const fetchInitialData = async () => {
      if (id) {
        try {
          setLoading(true)
          const classData = await getClassById(Number(id))
          setClassInfo(classData)
          setForm({ class_name: classData.class_name, is_active: classData.is_active })

          const [
            usersData,
            curriculumsData,
            subjectsData,
            holidayData,
            classtimeData,
            studentsInClassData,
            allStudentsData,
            allTestsData,
            detailsData,
            homeworkProgressData,
          ] = await Promise.all([
            getAllUsers(),
            getAllCurriculums(),
            getAllSubjects(),
            holidayApi.getAllHolidays(),
            getAllClasstimes(),
            getStudentsInClass(Number(id)),
            getAllStudents(),
            getAllTests({ class_id: Number(id) }),
            getAllCurriculumDetails({ curriculum_id: classData.curriculum_id }),
            getClassHomeworkProgressReport(Number(id)),
          ])

          setUsers(usersData)
          setCurriculums(curriculumsData)
          setSubjects(subjectsData)
          setHolidays(holidayData)
          setClasstimes(classtimeData)
          setStudentsInClass(studentsInClassData)
          setAllStudents(allStudentsData)
          setTests(allTestsData)
          setCurriculumDetails(detailsData)
          setHomeworkProgress(homeworkProgressData)

          // ✨ 추가: 학생 목록을 기반으로 각 학생의 과목별 성취도 데이터를 불러옵니다.
          if (studentsInClassData.length > 0) {
            const progressPromises = studentsInClassData.map(student =>
              getStudentSubjectProgress(student.student_id),
            )
            const progressResults = await Promise.all(progressPromises)

            const progressMap: Record<number, StudentSubjectProgressReport[]> = {}
            studentsInClassData.forEach((student, index) => {
              // 현재 반(class)에 해당하는 데이터만 필터링
              progressMap[student.student_id] = progressResults[index].filter(
                p => p.class_id === Number(id),
              )
            })
            setStudentSubjectProgress(progressMap)
          }
        } catch (err) {
          setError('데이터를 불러오지 못했습니다.')
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchInitialData()
  }, [id])

  // [수정 1] 동적 너비 계산을 위한 useMemo 훅 추가
  const columnLayout = useMemo(() => {
    if (!classInfo?.schedule_details_json) {
      // 정보가 없으면 모든 열에 20%씩 균등 배분
      const equalWidth = `${100 / daysOfWeek.length}%`
      return daysOfWeek.reduce(
        (acc, day) => {
          acc[day.value] = equalWidth
          return acc
        },
        {} as Record<string, string>,
      )
    }

    const dataDays = new Set(classInfo.schedule_details_json.map(d => d.weekday))
    const dataDayCount = dataDays.size
    const emptyDayCount = daysOfWeek.length - dataDayCount

    const layout: Record<string, string> = {}

    if (dataDayCount > 0) {
      // 수업 있는 날과 없는 날의 너비 비율 (예: 3:1)
      const dataDayRatio = 3
      const emptyDayRatio = 1
      const totalRatio = dataDayCount * dataDayRatio + emptyDayCount * emptyDayRatio

      const dataDayWidth = (100 * dataDayRatio) / totalRatio
      const emptyDayWidth = (100 * emptyDayRatio) / totalRatio

      daysOfWeek.forEach(day => {
        if (dataDays.has(day.value)) {
          layout[day.value] = `${dataDayWidth}%`
        } else {
          layout[day.value] = `${emptyDayWidth}%`
        }
      })
    } else {
      // 모든 요일에 수업이 없는 경우
      const equalWidth = `${100 / daysOfWeek.length}%`
      daysOfWeek.forEach(day => {
        layout[day.value] = equalWidth
      })
    }

    return layout
  }, [classInfo])

  // ✨ 추가: 'Mon/Wed/Fri' 같은 문자열을 Set으로 변환하여 쉽게 조회하도록 함
  const classDaysSet = useMemo(() => {
    if (!classInfo?.attend_day) return new Set<string>()
    return new Set(classInfo.attend_day.split('/'))
  }, [classInfo?.attend_day])

  const getCurriculumName = (curriculumId: number) => {
    return curriculums.find(c => c.curriculum_id === curriculumId)?.curriculum_name || '알 수 없음'
  }

  const getTeacherName = (userId: number | null | undefined) => {
    // null 타입 추가
    if (!userId) return '-' // 이 조건문이 null과 undefined를 모두 처리해줍니다.
    return users.find(u => u.user_id === userId)?.username || `알 수 없음 (#${userId})`
  }

  const getSubjectName = (subjectId: number | undefined) => {
    if (!subjectId) return '-'
    return (
      subjects.find(s => s.subject_id === subjectId)?.subject_name || `알 수 없음 (#${subjectId})`
    )
  }

  const subjectColors = [
    'bg-blue-100',
    'bg-green-100',
    'bg-yellow-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-indigo-100',
  ]
  const getSubjectColor = (subjectId: number) => {
    return subjectColors[subjectId % subjectColors.length]
  }

  const subjectsInClass = useMemo(() => {
    if (!classInfo?.schedule_details_json || subjects.length === 0) {
      return []
    }

    const subjectIds = new Set(
      classInfo.schedule_details_json
        .map(detail => detail.subject_id)
        .filter(id => id !== null && id !== undefined),
    )

    return subjects.filter(subject => subjectIds.has(subject.subject_id))
  }, [classInfo, subjects])

  const mappedSessions = useMemo(() => {
    if (!selectedSemester || !classInfo?.schedule_details_json || curriculumDetails.length === 0) {
      return {}
    }

    const sessions: { [key: string]: { subject_id: number; day: number; progress: string }[] } = {}
    const subjectDayCounters: { [key: number]: number } = {}

    classInfo.schedule_details_json.forEach((detail: ScheduleDetail) => {
      if (detail.subject_id) {
        subjectDayCounters[detail.subject_id] = 1
      }
    })

    let currentDate = new Date(selectedSemester.semester_start_at)
    const endDate = new Date(selectedSemester.semester_end_at)

    while (currentDate <= endDate) {
      const dateString = formatDate(currentDate)
      const dayOfWeek = daysOfWeek[currentDate.getDay() - 1]?.value

      const isHoliday = holidays.some(h => h.holiday_date === dateString)
      const isTestDay = tests.some(t => t.test_day === dateString)

      if (!isHoliday && !isTestDay && dayOfWeek) {
        const subjectsForDay = classInfo.schedule_details_json.filter(
          (detail: ScheduleDetail) => detail.weekday.toUpperCase() === dayOfWeek.toUpperCase(),
        )

        subjectsForDay.forEach((schedule: ScheduleDetail) => {
          if (schedule.subject_id) {
            const dayCount = subjectDayCounters[schedule.subject_id]
            const curriculumDetailForDay = curriculumDetails.find(
              cd => cd.subject_id === schedule.subject_id && cd.day === dayCount,
            )

            if (curriculumDetailForDay) {
              if (!sessions[dateString]) {
                sessions[dateString] = []
              }
              sessions[dateString].push({
                subject_id: schedule.subject_id,
                day: dayCount,
                progress: curriculumDetailForDay.progress,
              })
              subjectDayCounters[schedule.subject_id]++
            }
          }
        })
      }
      currentDate = addDays(currentDate, 1)
    }
    return sessions
  }, [selectedSemester, classInfo, curriculumDetails, holidays, tests])

  const calendarWeeks = useMemo(() => {
    if (!selectedSemester) return []
    const startDate = new Date(selectedSemester.semester_start_at)
    const endDate = new Date(selectedSemester.semester_end_at)
    const weeks: Date[][] = []
    let currentWeekStart = getStartOfWeek(new Date(startDate))
    while (currentWeekStart <= endDate) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        const day = addDays(currentWeekStart, i)
        if (day.getDay() !== 0 && day.getDay() !== 6) {
          week.push(day)
        }
      }
      if (week.length > 0) {
        weeks.push(week)
      }
      currentWeekStart = addDays(currentWeekStart, 7)
    }
    return weeks
  }, [selectedSemester])

  const getHolidayName = (date: Date) => {
    const dateString = formatDate(date)
    const holiday = holidays.find(h => h.holiday_date === dateString)
    return holiday ? holiday.holiday_name : null
  }

  const getClasstimeString = (classtime_id: number | undefined) => {
    if (!classtime_id) return null
    const classtime = classtimes.find(c => c.time_id === classtime_id)
    return classtime
      ? `${classtime.start_time.substring(0, 5)} - ${classtime.end_time.substring(0, 5)}`
      : null
  }

  const studentsForModal = useMemo(() => {
    const filtered = allStudents.filter(
      student =>
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.english_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    const sorted = filtered.sort((a, b) =>
      (a.english_name || '').localeCompare(b.english_name || ''),
    )
    const registered = sorted.filter(s => draftSelectedIds.has(s.student_id))
    const available = sorted.filter(s => !draftSelectedIds.has(s.student_id))
    return { registered, available }
  }, [allStudents, draftSelectedIds, searchTerm])

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    setDraftSelectedIds(prev => {
      const newSet = new Set(prev)
      if (checked) newSet.add(studentId)
      else newSet.delete(studentId)
      return newSet
    })
  }

  const handleAssignmentComplete = async () => {
    if (!id) return
    const originalIds = new Set(studentsInClass.map(s => s.student_id))
    const toAdd = [...draftSelectedIds].filter(id => !originalIds.has(id))
    const toRemove = [...originalIds].filter(id => !draftSelectedIds.has(id))
    try {
      const promises = []
      if (toAdd.length > 0) promises.push(assignStudentsToClass(Number(id), toAdd))
      if (toRemove.length > 0) {
        toRemove.forEach(studentId => promises.push(removeStudentFromClass(Number(id), studentId)))
      }
      await Promise.all(promises)
      const updatedStudentsInClass = await getStudentsInClass(Number(id))
      setStudentsInClass(updatedStudentsInClass)
      setIsRegisterModalOpen(false)
      setSearchTerm('')
    } catch (err) {
      console.error('학생 지정 실패:', err)
      alert('학생 지정에 실패했습니다.')
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleDateClick = (day: Date) => {
    setSelectedDate(day)
    setEditingTest(null)
    setNewTestInfo({
      class_id: Number(id),
      test_day: formatDate(day),
    })
    setIsTestModalOpen(true)
  }

  const handleTestSubmit = async () => {
    if (!newTestInfo.test_title || !newTestInfo.subject_id || !newTestInfo.test_day) {
      alert('시험 제목과 과목을 모두 입력해주세요.')
      return
    }

    try {
      if (editingTest) {
        // --- 시험 수정 로직 ---
        const updated = await updateTest(editingTest.test_id, {
          test_title: newTestInfo.test_title,
          subject_id: newTestInfo.subject_id,
        })
        setTests(prev => prev.map(t => (t.test_id === editingTest.test_id ? updated : t)))

        // ✨ 수정 후에는 모달을 닫고 모든 상태를 초기화합니다.
        setIsTestModalOpen(false)
        setNewTestInfo({})
        setEditingTest(null)
      } else {
        // --- 새 시험 생성 로직 ---
        const created = await createTest({
          ...newTestInfo,
          class_id: Number(id),
        } as CreateTestRequest)
        setTests(prev => [...prev, created])

        // ✨ 생성 후에는 모달을 닫지 않고, 입력 필드만 초기화합니다.
        // 날짜와 반 ID는 유지하여 연속 등록이 가능하도록 합니다.
        setNewTestInfo(prev => ({
          class_id: prev.class_id,
          test_day: prev.test_day,
          test_title: '', // 제목만 초기화
          subject_id: undefined, // 과목 선택만 초기화
        }))
      }
    } catch (err) {
      console.error('시험 처리 실패:', err)
      alert(`시험 ${editingTest ? '수정' : '생성'}에 실패했습니다.`)
    }
  }

  const handleDeleteTest = async (testId: number) => {
    if (window.confirm('정말로 이 시험을 삭제하시겠습니까?')) {
      try {
        await deleteTest(testId)
        setTests(prev => prev.filter(t => t.test_id !== testId))
      } catch (err) {
        console.error('시험 삭제 실패:', err)
        alert('시험 삭제에 실패했습니다.')
      }
    }
  }

  const startEditingTest = (test: Test) => {
    setEditingTest(test)
    setNewTestInfo({
      test_title: test.test_title,
      subject_id: test.subject_id,
      test_day: test.test_day,
      class_id: test.class_id,
    })
  }

  const closeModal = () => {
    setIsTestModalOpen(false)
    setEditingTest(null)
    setNewTestInfo({})
  }

  if (loading) return <Loading />
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!classInfo) return <div className="p-6">반 정보를 찾을 수 없습니다.</div>

  const detailTabs = [
    {
      id: 'class-info',
      label: '반 정보',
      content: (
        <>
          {/* 기존 TabsContent 'class-info' 안에 있던 모든 JSX를 여기에 넣습니다. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-28 h-28 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-purple-700">
                  {classInfo.class_name?.[0] || '반'}
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900">{classInfo.class_name}</h3>
                <p className="text-md text-gray-500 mb-3">
                  {getCurriculumName(classInfo.curriculum_id)}
                </p>
                <div className="space-y-2">
                  <Badge tone="primary">{classInfo.is_active ? '활성화' : '비활성화'}</Badge>
                  <br />
                  <Badge tone="warning">정원 정보 없음</Badge>
                </div>
              </div>
              <div className="text-sm text-gray-600 pt-4 border-t w-full text-center">
                <p className="mb-1">
                  개설일:{' '}
                  {classInfo.created_at ? new Date(classInfo.created_at).toLocaleDateString() : '-'}
                </p>
                <p>학기: {selectedSemester?.semester_name || '-'}</p>
              </div>
              {canEdit && !classInfo.is_active && (
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

            <div className="space-y-4">
              <Input
                label="반 이름"
                name="class_name"
                value={editMode ? form.class_name || '' : classInfo.class_name}
                onChange={handleFormChange}
                disabled={!editMode}
              />
              <div>
                <Label>수업 요일</Label>
                <p className="mt-1 text-sm text-gray-900 h-9 flex items-center px-3 bg-gray-50 border border-gray-300 rounded-md">
                  {classInfo.attend_day}
                </p>
              </div>
              <div>
                <Label>한국인 담임</Label>
                <p className="mt-1 text-sm text-gray-900 h-9 flex items-center px-3 bg-gray-50 border border-gray-300 rounded-md">
                  {getTeacherName(classInfo.kr_homeroom_id)}
                </p>
              </div>
              <div>
                <Label>원어민 담임</Label>
                <p className="mt-1 text-sm text-gray-900 h-9 flex items-center px-3 bg-gray-50 border border-gray-300 rounded-md">
                  {getTeacherName(classInfo.fr_homeroom_id)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Label className="mb-2 block">과목별 수업 정보</Label>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 border">과목</th>
                  <th className="py-2 px-3 border">수업 일자</th>
                  <th className="py-2 px-3 border">수업 시간</th>
                  <th className="py-2 px-3 border">담당 선생님</th>
                </tr>
              </thead>
              <tbody>
                {classInfo.schedule_details_json && classInfo.schedule_details_json.length > 0 ? (
                  classInfo.schedule_details_json.map((detail: ScheduleDetail, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 border">{getSubjectName(detail.subject_id)}</td>
                      <td className="py-2 px-3 border">
                        {daysOfWeek.find(d => d.value === detail.weekday)?.label || detail.weekday}
                      </td>
                      <td className="py-2 px-3 border">
                        {getClasstimeString(detail.classtime_id) || '-'}
                      </td>
                      <td className="py-2 px-3 border">{getTeacherName(detail.teacher_id)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">
                      상세 수업 정보가 등록되지 않았거나, 서버에서 데이터를 불러올 수 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'student-list',
      label: '수강생 목록',
      content: (
        <>
          {/* 기존 TabsContent 'student-list' 안에 있던 모든 JSX를 여기에 넣습니다. */}
          {canEdit && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  setDraftSelectedIds(new Set(studentsInClass.map(s => s.student_id)))
                  setIsRegisterModalOpen(true)
                }}
              >
                ➕ 수강생 지정
              </Button>
            </div>
          )}
          {studentsInClass.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* studentsInClass 배열을 기준으로 학생 카드를 렌더링 */}
              {studentsInClass.map(student => {
                // 각 학생에게 맞는 숙제 리포트 데이터를 찾음
                const progressReport = homeworkProgress?.reports.find(
                  report => report.student_id === student.student_id,
                )

                const subjectRates = studentSubjectProgress[student.student_id]

                return (
                  <StudentCard
                    key={student.student_id}
                    studentId={student.student_id} // ✨ 추가
                    englishName={student.english_name}
                    studentName={student.student_name}
                    overallRate={progressReport?.completion_rate || 0}
                    subjectRates={subjectRates} // ✨ 추가
                  />
                )
              })}
            </div>
          ) : (
            // 수강생이 없을 때의 메시지로 수정
            <div className="text-center py-12 text-gray-500">
              <p>등록된 수강생이 없습니다.</p>
            </div>
          )}

          <Modal
            isOpen={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            title="수강생 지정"
            description="반에 등록할 학생을 선택하세요."
          >
            <div className="space-y-4">
              <Input
                placeholder="학생 이름으로 검색"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="max-h-96 overflow-y-auto border rounded-md p-2 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 px-1">
                    등록된 학생 ({studentsForModal.registered.length})
                  </h4>
                  {studentsForModal.registered.length > 0 ? (
                    studentsForModal.registered.map(student => (
                      <div key={student.student_id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`student-${student.student_id}`}
                          checked={draftSelectedIds.has(student.student_id)}
                          onCheckedChange={checked =>
                            handleSelectStudent(student.student_id, !!checked)
                          }
                        />
                        <Label htmlFor={`student-${student.student_id}`}>
                          {student.english_name} ({student.student_name})
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 px-1">없음</p>
                  )}
                </div>
                <hr />
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 px-1">
                    등록 가능한 학생 ({studentsForModal.available.length})
                  </h4>
                  {studentsForModal.available.length > 0 ? (
                    studentsForModal.available.map(student => (
                      <div key={student.student_id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`student-${student.student_id}`}
                          checked={draftSelectedIds.has(student.student_id)}
                          onCheckedChange={checked =>
                            handleSelectStudent(student.student_id, !!checked)
                          }
                        />
                        <Label htmlFor={`student-${student.student_id}`}>
                          {student.english_name} ({student.student_name})
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 px-1">없음</p>
                  )}
                </div>
              </div>
              <Button onClick={handleAssignmentComplete} className="w-full">
                지정 완료
              </Button>
            </div>
          </Modal>
        </>
      ),
    },
    {
      id: 'class-calendar',
      label: '수업 캘린더',
      content: (
        <>
          {/* 기존 TabsContent 'class-calendar' 안에 있던 모든 JSX를 여기에 넣습니다. */}
          {selectedSemester ? (
            <Card>
              <CardHeader
                title={`${selectedSemester.semester_name} 캘린더`}
                subtitle={`${formatDate(
                  new Date(selectedSemester.semester_start_at),
                )} ~ ${formatDate(new Date(selectedSemester.semester_end_at))}`}
                right={
                  canEdit &&
                  !classInfo.is_active && (
                    <div className="flex items-center gap-4">
                      {isTestRegistrationMode ? (
                        <>
                          {/* ... */}
                          <Button
                            variant="outline"
                            onClick={() => setIsTestRegistrationMode(false)}
                          >
                            등록 완료
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsTestRegistrationMode(true)}>시험 등록</Button>
                      )}
                    </div>
                  )
                }
              />
              <CardContent>
                {isTestRegistrationMode && (
                  <div className="p-3 mb-4 text-center bg-blue-100 border border-blue-300 text-blue-800 rounded-md text-sm font-semibold animate-pulse">
                    시험을 등록할 날짜를 달력에서 클릭하세요.
                  </div>
                )}
                <div className="overflow-x-auto">
                  {/* [수정 2] 테이블에 w-full과 table-fixed를 적용하고 thead/tbody 렌더링 방식을 수정 */}
                  <table className="min-w-full w-full bg-white border border-gray-200 table-fixed">
                    <thead>
                      <tr>
                        {daysOfWeek.map(day => (
                          <th
                            key={day.value}
                            className="text-center py-3 px-4 font-medium text-gray-700 bg-gray-100 border-b"
                            style={{ width: columnLayout[day.value] }} // 동적 너비 적용
                          >
                            {day.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calendarWeeks.map((week: Date[], weekIndex: number) => (
                        <tr key={weekIndex}>
                          {daysOfWeek.map(dayInfo => {
                            // 해당 요일에 맞는 날짜 데이터를 찾음 (월=1, 화=2, ...)
                            const day = week.find(
                              d =>
                                (d.getDay() === 0 ? 7 : d.getDay()) ===
                                daysOfWeek.findIndex(dw => dw.value === dayInfo.value) + 1,
                            )

                            if (!day) {
                              // 주말 등으로 인해 해당 요일의 날짜가 없는 경우 빈 칸 렌더링
                              return (
                                <td
                                  key={dayInfo.value}
                                  className="border-b border-r"
                                  style={{ width: columnLayout[dayInfo.value] }}
                                />
                              )
                            }

                            const holidayName = getHolidayName(day)
                            const isHoliday = !!holidayName
                            const dayString = formatDate(day)
                            const sessionsForDay = mappedSessions[dayString] || []
                            const testsForDay = tests.filter(t => t.test_day === dayString)

                            // ✨ 추가: 현재 날짜가 수업 요일인지 확인
                            const dayOfWeekShort = daysOfWeek[day.getDay() - 1]?.value // 'Mon', 'Tue' 등
                            const isClassDay = classDaysSet.has(dayOfWeekShort)

                            // ✨ 추가: 클릭 가능 여부를 모든 조건(등록모드, 휴일 아님, 수업 요일)으로 판단
                            const isClickable = isTestRegistrationMode && !isHoliday && isClassDay

                            return (
                              <td
                                key={dayInfo.value}
                                className={`py-2 px-2 border-b border-r align-top relative h-32 transition-colors duration-200 ${
                                  isHoliday
                                    ? 'bg-red-50 text-red-700' // 휴일 스타일
                                    : isClickable
                                      ? 'bg-sky-50 hover:bg-sky-200 cursor-pointer border-sky-300 border-dashed' // 클릭 가능 스타일
                                      : isTestRegistrationMode
                                        ? 'bg-gray-50 text-gray-400' // 등록 모드이지만 클릭 불가 스타일
                                        : '' // 일반 상태
                                }`}
                                // ✨ 클릭 이벤트에도 isClickable 조건 사용
                                onClick={() => isClickable && handleDateClick(day)}
                              >
                                <div className="text-sm font-medium text-center">{`${day.getMonth() + 1}/${day.getDate()}`}</div>
                                {isHoliday && (
                                  <div className="text-xs font-semibold mt-1 text-center">
                                    {holidayName}
                                  </div>
                                )}
                                <div className="text-xs mt-1 space-y-1">
                                  {sessionsForDay.map((session, sessionIdx) => (
                                    <div
                                      key={sessionIdx}
                                      className={`p-1 rounded-sm text-left ${getSubjectColor(
                                        session.subject_id,
                                      )}`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <p className="font-medium text-gray-800 truncate">
                                          {getSubjectName(session.subject_id)}
                                        </p>
                                        <p className="text-gray-600 font-semibold">
                                          Day {session.day}
                                        </p>
                                      </div>
                                      <p className="text-xs text-gray-700 truncate mt-1">
                                        {session.progress}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                {testsForDay.length > 0 && (
                                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-full px-1">
                                    {testsForDay.map(test => (
                                      <Badge
                                        key={test.test_id}
                                        tone="success"
                                        className="text-xs w-full truncate"
                                      >
                                        {test.test_title}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>캘린더를 보려면 페이지 상단의 브레드크럼에서 학기를 선택해주세요.</p>
            </div>
          )}
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <StyledTabs tabs={detailTabs} defaultTabId={activeTab} />
        </CardContent>
      </Card>

      <Modal
        isOpen={isTestModalOpen}
        onClose={closeModal}
        title={selectedDate ? `${formatDate(selectedDate)} 시험 관리` : '시험 관리'}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">시험 목록</h3>
            {tests.filter(t => selectedDate && t.test_day === formatDate(selectedDate)).length >
            0 ? (
              <ul className="space-y-2">
                {tests
                  .filter(t => selectedDate && t.test_day === formatDate(selectedDate))
                  .map(test => (
                    <li
                      key={test.test_id}
                      className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => startEditingTest(test)}
                    >
                      <span>
                        {test.test_title} ({getSubjectName(test.subject_id)})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteTest(test.test_id)
                        }}
                      >
                        X
                      </Button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">해당 날짜에 등록된 시험이 없습니다.</p>
            )}
          </div>

          <hr />

          <div>
            <h3 className="text-lg font-medium mb-2">
              {editingTest ? '시험 수정' : '새 시험 등록'}
            </h3>
            <div className="space-y-3">
              <Input
                label="시험 제목"
                placeholder="예: Chapter 5 Quiz"
                value={newTestInfo.test_title || ''}
                onChange={e => setNewTestInfo(prev => ({ ...prev, test_title: e.target.value }))}
              />
              <div>
                <Label>과목</Label>
                <Select
                  options={[
                    { value: '', label: '과목을 선택하세요' },
                    ...subjectsInClass.map(subject => ({
                      value: String(subject.subject_id),
                      label: subject.subject_name,
                    })),
                  ]}
                  value={newTestInfo.subject_id ? String(newTestInfo.subject_id) : ''}
                  onChange={e =>
                    setNewTestInfo(prev => ({ ...prev, subject_id: Number(e.target.value) }))
                  }
                />
              </div>
              <Button onClick={handleTestSubmit} className="w-full">
                {editingTest ? '수정하기' : '등록하기'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

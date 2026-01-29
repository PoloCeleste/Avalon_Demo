// Homeworks.tsx

import { useState, useEffect, useMemo, type ChangeEvent } from 'react'
import { useAuthStore } from '../store/authStore'
import { usePageHeader } from '../contexts/PageHeaderContext'
import { getStudentsInClass, getClassesForStudent } from '../api/classStudent.api'
import {
  getAllCheckHomeworks,
  createCheckHomework,
  deleteCheckHomework,
  checkAllHomeworks, // ✨ 추가
  uncheckAllHomeworks, // ✨ 추가
} from '../api/checkHomework.api'
import { getClassHomeworkDueDates, getClassSessions, getClassById } from '../api/class.api'
import { getAllStudents } from '../api/student.api'
import { getHomeworkById, getAllHomeworks } from '../api/homework.api'
import { getAllCurriculumDetails } from '../api/curriculumDetail.api'
import { getAllSubjects } from '../api/subject.api'
import { getAllHolidays } from '../api/holiday.api'
import { getAllTests } from '../api/test.api'
import type { Student } from '../types/student'
import type { CheckHomework } from '../types/checkHomework'
import type { HomeworkDueDate, StudentClassInfo, ClassSession, ClassItem } from '../types/class'
import type { Homework } from '../types/homework'
import type { CurriculumDetail } from '../types/curriculumDetail'
import type { Subject } from '../types/subject'
import type { Holiday } from '../types/holiday'
import type { Test } from '../types/test'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import StyledTabs from '../components/ui/StyledTabs'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Checkbox } from '../components/ui/Checkbox'
import Loading from '../components/ui/Loading'
import { Label } from '../components/ui/Label'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
// import { useTimeStore } from '../store/timeStore' // 시간여행시에 사용
import ClassCalendar, { type MappedSession } from '../components/ClassCalendar'
import { Badge } from '../components/ui/Badge'

// 날짜 유틸리티 함수
const toDateString = (date: Date) => date.toISOString().split('T')[0]
const getStartOfWeek = (date: Date) => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const newDate = new Date(date)
  newDate.setDate(diff)
  return newDate
}
const addDays = (date: Date, days: number) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}
const daysOfWeek = [
  { value: 'Mon', label: '월' },
  { value: 'Tue', label: '화' },
  { value: 'Wed', label: '수' },
  { value: 'Thu', label: '목' },
  { value: 'Fri', label: '금' },
]

interface HomeworkData {
  students: Student[]
  homeworks: (HomeworkDueDate & Pick<Homework, 'homework_contents' | 'homework_name'>)[]
  checked: CheckHomework[]
}

export default function HomeworksPage() {
  const { isAuthenticated, user } = useAuthStore()
  const { selectedSemester, setDescription } = usePageHeader()
  const [error, setError] = useState<string | null>(null)
  // const { now } = useTimeStore() // 시간여행시에 사용
  const now = useMemo(() => new Date(), [])

  // '내 숙제 확인' 탭 상태
  const [loadingMyTab, setLoadingMyTab] = useState(false)
  const [todaysClasses, setTodaysClasses] = useState<ClassSession[]>([])
  const [selectedClassIdForMyTab, setSelectedClassIdForMyTab] = useState<number | null>(null)
  const [homeworkDataByClass, setHomeworkDataByClass] = useState<Record<number, HomeworkData>>({})

  // '학생 숙제 확인' 탭 상태
  const [loadingStudentTab, setLoadingStudentTab] = useState(false)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentClasses, setStudentClasses] = useState<StudentClassInfo[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)

  // 학생 숙제 캘린더용 상태
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [studentTabClassInfo, setStudentTabClassInfo] = useState<ClassItem | null>(null)
  const [studentTabCurriculumDetails, setStudentTabCurriculumDetails] = useState<
    CurriculumDetail[]
  >([])
  const [allSemesterHomeworks, setAllSemesterHomeworks] = useState<Homework[]>([])
  const [allSemesterChecked, setAllSemesterChecked] = useState<CheckHomework[]>([])
  const [studentTabHolidays, setStudentTabHolidays] = useState<Holiday[]>([])
  const [studentTabTests, setStudentTabTests] = useState<Test[]>([])
  const [studentTabHomeworks, setStudentTabHomeworks] = useState<Homework[]>([])
  const [studentTabCheckedHomeworks, setStudentTabCheckedHomeworks] = useState<CheckHomework[]>([])

  // 데이터 로딩 및 핸들러 함수들 (내부 로직 변경 없음)
  useEffect(() => {
    setDescription('학생별 숙제 현황을 캘린더로 확인하고 관리하는 페이지입니다.')
    return () => setDescription(undefined)
  }, [setDescription])

  useEffect(() => {
    if (!isAuthenticated || !user?.user_id || !selectedSemester) return
    const fetchTodaysClassesAndHomeworks = async () => {
      setLoadingMyTab(true)
      setError(null)
      try {
        const today = toDateString(now)
        const sessions = await getClassSessions({
          teacher_id: user.user_id,
          session_date: today,
          semester_id: selectedSemester.semester_id,
        })
        const uniqueClassIds = [...new Set(sessions.map(s => s.class_id))]
        const classDetailsPromises = uniqueClassIds.map(id => getClassById(id))
        const classDetails = await Promise.all(classDetailsPromises)
        const classDetailsMap = new Map(classDetails.map(c => [c.class_id, c]))
        const enrichedSessions = sessions.map(session => ({
          ...session,
          class_name: classDetailsMap.get(session.class_id)?.class_name || '',
        }))
        const sortedSessions = [...enrichedSessions].sort((a, b) =>
          a.class_name && b.class_name ? a.class_name.localeCompare(b.class_name) : 0,
        )
        setTodaysClasses(sortedSessions)
        if (sessions.length === 0) {
          setHomeworkDataByClass({})
          setSelectedClassIdForMyTab(null)
          setLoadingMyTab(false)
          return
        }
        const classIds = [...new Set(sessions.map(s => s.class_id))]
        if (classIds.length > 0 && selectedClassIdForMyTab === null)
          setSelectedClassIdForMyTab(classIds[0])
        const classDataPromises = classIds.map(async classId => {
          const [students, homeworksDue, checked] = await Promise.all([
            getStudentsInClass(classId),
            getClassHomeworkDueDates(classId, today),
            getAllCheckHomeworks({ class_id: classId }),
          ])
          const homeworkDetailsPromises = homeworksDue.map(hw => getHomeworkById(hw.homework_id))
          const homeworkDetails = await Promise.all(homeworkDetailsPromises)
          const homeworksWithContent = homeworksDue
            .filter(hw => hw.tag_name !== 'OVERDUE')
            .map(hw => {
              const detail = homeworkDetails.find(d => d.homework_id === hw.homework_id)
              return {
                ...hw,
                homework_contents: detail?.homework_contents || '',
                homework_name: detail?.homework_name || '',
              }
            })
          const sortedStudents = [...students].sort((a, b) =>
            a.student_name.localeCompare(b.student_name),
          )
          return {
            classId,
            data: { students: sortedStudents, homeworks: homeworksWithContent, checked },
          }
        })
        const results = await Promise.all(classDataPromises)
        const newHomeworkData: Record<number, HomeworkData> = {}
        results.forEach(result => {
          newHomeworkData[result.classId] = result.data
        })
        setHomeworkDataByClass(newHomeworkData)
      } catch (err) {
        console.error(err)
        setError('오늘의 숙제 정보를 불러오는 데 실패했습니다.')
      } finally {
        setLoadingMyTab(false)
      }
    }
    fetchTodaysClassesAndHomeworks()
  }, [isAuthenticated, user, selectedSemester, now, selectedClassIdForMyTab])

  useEffect(() => {
    const fetchCommonData = async () => {
      setLoadingStudentTab(true)
      try {
        const [students, subjects] = await Promise.all([getAllStudents(), getAllSubjects()])
        setAllStudents(students)
        setAllSubjects(subjects)
      } catch (err) {
        console.error(err)
        setError('학생 또는 과목 정보를 불러오는 데 실패했습니다.')
      } finally {
        setLoadingStudentTab(false)
      }
    }
    fetchCommonData()
  }, [])

  useEffect(() => {
    const fetchCalendarBaseData = async () => {
      if (!selectedClassId || !selectedStudent) return
      setLoadingStudentTab(true)
      setError(null)
      try {
        const classInfoData = await getClassById(selectedClassId)
        setStudentTabClassInfo(classInfoData)
        if (classInfoData?.curriculum_id) {
          const curriculumId = classInfoData.curriculum_id
          const [details, holidays, tests] = await Promise.all([
            getAllCurriculumDetails({ curriculum_id: curriculumId }),
            getAllHolidays(),
            getAllTests({ class_id: selectedClassId }),
          ])
          const homeworksForClass = allSemesterHomeworks.filter(
            hw => hw.curriculum_id === curriculumId,
          )
          setStudentTabCurriculumDetails(details)
          setStudentTabHolidays(holidays)
          setStudentTabTests(tests)
          setStudentTabHomeworks(homeworksForClass)
        }
      } catch (err) {
        console.error(err)
        setError('선택한 반의 캘린더 정보를 불러오는 데 실패했습니다.')
      } finally {
        setLoadingStudentTab(false)
      }
    }
    fetchCalendarBaseData()
  }, [selectedClassId, selectedStudent, allSemesterHomeworks])

  useEffect(() => {
    if (!selectedClassId) return
    const checkedForClass = allSemesterChecked.filter(chk => chk.class_id === selectedClassId)
    setStudentTabCheckedHomeworks(checkedForClass)
  }, [allSemesterChecked, selectedClassId])

  useEffect(() => {
    const fetchStudentDataForSemester = async () => {
      if (!selectedStudent || !selectedSemester) return
      setLoadingStudentTab(true)
      setError(null)
      try {
        const classes = await getClassesForStudent(selectedStudent.student_id, {
          semester_id: selectedSemester.semester_id,
        })
        setStudentClasses(classes)
        if (classes.length > 0) {
          if (!selectedClassId || !classes.some(c => c.class_id === selectedClassId)) {
            setSelectedClassId(classes[0].class_id)
          }
          const curriculumIds = [...new Set(classes.map(c => c.curriculum_id).filter(id => id))]
          const homeworkPromises = curriculumIds.map(id =>
            getAllHomeworks({ curriculum_id: id, limit: 1000 }),
          )
          const homeworkByCurriculum = await Promise.all(homeworkPromises)
          const allHws = homeworkByCurriculum
            .map((homeworkList, index) => {
              const curriculumId = curriculumIds[index]
              return homeworkList.map(hw => ({ ...hw, curriculum_id: curriculumId }))
            })
            .flat()
          setAllSemesterHomeworks(allHws)
          const allChecked = await getAllCheckHomeworks({
            student_id: selectedStudent.student_id,
          })
          setAllSemesterChecked(allChecked)
        } else {
          setSelectedClassId(null)
          setStudentClasses([])
          setAllSemesterHomeworks([])
          setAllSemesterChecked([])
        }
      } catch (err) {
        console.error(err)
        setError(`${selectedStudent.student_name} 학생의 정보를 가져오지 못했습니다.`)
      } finally {
        setLoadingStudentTab(false)
      }
    }
    fetchStudentDataForSemester()
  }, [selectedStudent, selectedSemester, selectedClassId])

  const handleCheckChange = async (
    studentId: number,
    homeworkId: number,
    classId: number,
    isChecked: boolean,
    tab: 'my' | 'student',
  ) => {
    if (!user?.user_id) {
      alert('사용자 정보가 없어 작업을 완료할 수 없습니다.')
      return
    }
    try {
      if (isChecked) {
        const newCheck = await createCheckHomework({
          student_id: studentId,
          homework_id: homeworkId,
          checker_id: user.user_id,
          class_id: classId,
        })
        if (tab === 'my') {
          setHomeworkDataByClass(prev => ({
            ...prev,
            [classId]: { ...prev[classId], checked: [...prev[classId].checked, newCheck] },
          }))
        } else {
          setAllSemesterChecked(prev => [...prev, newCheck])
        }
      } else {
        const checkList =
          tab === 'my' ? (homeworkDataByClass[classId]?.checked ?? []) : allSemesterChecked
        const checkToDelete = checkList.find(
          c => c.student_id === studentId && c.homework_id === homeworkId,
        )
        if (checkToDelete) {
          await deleteCheckHomework(checkToDelete.check_homework_id)
          if (tab === 'my') {
            setHomeworkDataByClass(prev => ({
              ...prev,
              [classId]: {
                ...prev[classId],
                checked: prev[classId].checked.filter(
                  c => c.check_homework_id !== checkToDelete.check_homework_id,
                ),
              },
            }))
          } else {
            setAllSemesterChecked(prev =>
              prev.filter(c => c.check_homework_id !== checkToDelete.check_homework_id),
            )
          }
        }
      }
    } catch (err) {
      console.error('숙제 체크 변경에 실패했습니다.', err)
      alert('숙제 체크 상태 변경에 실패했습니다.')
    }
  }

  const handleCheckAll = async (
    homeworkId: number,
    subjectName: string,
    classId: number,
    areAllChecked: boolean,
  ) => {
    const subject = allSubjects.find(s => s.subject_name === subjectName)
    if (!subject) {
      alert('과목 정보를 찾을 수 없어 작업을 완료할 수 없습니다.')
      return
    }
    const subjectId = subject.subject_id
    try {
      if (areAllChecked) {
        await uncheckAllHomeworks({
          class_id: classId,
          subject_id: subjectId,
          homework_id: homeworkId,
        })
        setHomeworkDataByClass(prev => ({
          ...prev,
          [classId]: {
            ...prev[classId],
            checked: prev[classId].checked.filter(chk => chk.homework_id !== homeworkId),
          },
        }))
      } else {
        const newChecks = await checkAllHomeworks({
          class_id: classId,
          subject_id: subjectId,
          homework_id: homeworkId,
        })
        setHomeworkDataByClass(prev => ({
          ...prev,
          [classId]: {
            ...prev[classId],
            checked: [
              ...prev[classId].checked.filter(chk => chk.homework_id !== homeworkId),
              ...newChecks,
            ],
          },
        }))
      }
    } catch (err) {
      console.error('숙제 일괄 변경에 실패했습니다.', err)
      alert('숙제 일괄 체크 상태 변경에 실패했습니다.')
    }
  }

  // 데이터 가공 (useMemo) (변경 없음)
  const uniqueTodaysClasses = useMemo(() => {
    const unique = new Map<number, ClassSession>()
    todaysClasses.forEach(c => {
      if (!unique.has(c.class_id)) unique.set(c.class_id, c)
    })
    return Array.from(unique.values())
  }, [todaysClasses])

  const selectedMyClassData = useMemo(() => {
    if (!selectedClassIdForMyTab) return null
    return homeworkDataByClass[selectedClassIdForMyTab] || null
  }, [selectedClassIdForMyTab, homeworkDataByClass])

  const studentSearchFiltered = useMemo(() => {
    if (!searchTerm) return []
    return allStudents
      .filter(
        s =>
          s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.english_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .slice(0, 10)
  }, [searchTerm, allStudents])

  const studentTabCalendarWeeks = useMemo(() => {
    if (!selectedSemester) return []
    const startDate = new Date(selectedSemester.semester_start_at)
    const endDate = new Date(selectedSemester.semester_end_at)
    let currentWeekStart = getStartOfWeek(startDate)
    const weeks: Date[][] = []
    while (currentWeekStart <= endDate) {
      const week: Date[] = []
      for (let i = 0; i < 5; i++) week.push(addDays(currentWeekStart, i))
      weeks.push(week)
      currentWeekStart = addDays(currentWeekStart, 7)
    }
    return weeks
  }, [selectedSemester])

  const studentTabMappedSessions = useMemo((): Record<string, MappedSession[]> => {
    if (
      !selectedSemester ||
      !studentTabClassInfo?.schedule_details_json ||
      studentTabCurriculumDetails.length === 0
    )
      return {}
    const sessions: Record<string, MappedSession[]> = {}
    const subjectDayCounters: Record<number, number> = {}
    studentTabClassInfo.schedule_details_json.forEach(d => {
      if (d.subject_id) subjectDayCounters[d.subject_id] = 1
    })
    let currentDate = new Date(selectedSemester.semester_start_at)
    const endDate = new Date(selectedSemester.semester_end_at)
    while (currentDate <= endDate) {
      const dateString = toDateString(currentDate)
      const dayOfWeek = daysOfWeek[currentDate.getDay() - 1]?.value
      const isHoliday = studentTabHolidays.some(h => h.holiday_date === dateString)
      const isTestDay = studentTabTests.some(t => t.test_day === dateString)
      if (!isHoliday && !isTestDay && dayOfWeek) {
        const subjectsForDay = studentTabClassInfo.schedule_details_json.filter(
          d => d.weekday.toUpperCase() === dayOfWeek.toUpperCase(),
        )
        subjectsForDay.forEach(schedule => {
          if (schedule.subject_id) {
            const dayCount = subjectDayCounters[schedule.subject_id]
            const detail = studentTabCurriculumDetails.find(
              cd => cd.subject_id === schedule.subject_id && cd.day === dayCount,
            )
            if (detail) {
              if (!sessions[dateString]) sessions[dateString] = []
              sessions[dateString].push({
                subject_id: detail.subject_id,
                day: detail.day,
                progress: detail.progress,
                curri_detail_id: detail.curri_detail_id,
              })
              subjectDayCounters[schedule.subject_id]++
            }
          }
        })
      }
      currentDate = addDays(currentDate, 1)
    }
    return sessions
  }, [
    selectedSemester,
    studentTabClassInfo,
    studentTabCurriculumDetails,
    studentTabHolidays,
    studentTabTests,
  ])

  const homeworkDueDatesMap = useMemo(() => {
    const dueDates: Record<number, string> = {}
    if (!selectedSemester || !studentTabMappedSessions || studentTabHomeworks.length === 0) {
      return dueDates
    }
    const semesterEndDate = toDateString(new Date(selectedSemester.semester_end_at))
    const subjectToDatesMap: Record<number, string[]> = {}
    Object.entries(studentTabMappedSessions).forEach(([dateStr, sessionsOnDate]) => {
      sessionsOnDate.forEach(session => {
        const subjectId = session.subject_id
        if (!subjectToDatesMap[subjectId]) subjectToDatesMap[subjectId] = []
        subjectToDatesMap[subjectId].push(dateStr)
      })
    })
    for (const subjectId in subjectToDatesMap) {
      subjectToDatesMap[subjectId] = [...new Set(subjectToDatesMap[subjectId])].sort()
    }
    const sessionToDateMap: Record<number, string> = {}
    Object.entries(studentTabMappedSessions).forEach(([dateStr, sessionsOnDate]) => {
      sessionsOnDate.forEach(session => {
        sessionToDateMap[session.curri_detail_id] = dateStr
      })
    })
    studentTabHomeworks.forEach(hw => {
      const detail = studentTabCurriculumDetails.find(d => d.curri_detail_id === hw.curri_detail_id)
      const assignedDate = sessionToDateMap[hw.curri_detail_id]
      if (!detail || !assignedDate) return
      const subjectId = detail.subject_id
      const datesForSubject = subjectToDatesMap[subjectId]
      if (!datesForSubject) return
      const assignedDateIndex = datesForSubject.indexOf(assignedDate)
      if (assignedDateIndex > -1 && assignedDateIndex + 1 < datesForSubject.length) {
        dueDates[hw.homework_id] = datesForSubject[assignedDateIndex + 1]
      } else {
        dueDates[hw.homework_id] = semesterEndDate
      }
    })
    return dueDates
  }, [selectedSemester, studentTabMappedSessions, studentTabHomeworks, studentTabCurriculumDetails])

  const studentTabColumnLayout = useMemo(() => {
    if (!studentTabClassInfo?.schedule_details_json) {
      const equalWidth = `${100 / daysOfWeek.length}%`
      return daysOfWeek.reduce(
        (acc, day) => {
          acc[day.value] = equalWidth
          return acc
        },
        {} as Record<string, string>,
      )
    }
    const dataDays = new Set(studentTabClassInfo.schedule_details_json.map(d => d.weekday))
    const dataDayCount = dataDays.size
    const emptyDayCount = daysOfWeek.length - dataDayCount
    const layout: Record<string, string> = {}
    if (dataDayCount > 0) {
      const dataDayRatio = 3
      const emptyDayRatio = 1
      const totalRatio = dataDayCount * dataDayRatio + emptyDayCount * emptyDayRatio
      const dataDayWidth = (100 * dataDayRatio) / totalRatio
      const emptyDayWidth = (100 * emptyDayRatio) / totalRatio
      daysOfWeek.forEach(day => {
        layout[day.value] = dataDays.has(day.value) ? `${dataDayWidth}%` : `${emptyDayWidth}%`
      })
    } else {
      const equalWidth = `${100 / daysOfWeek.length}%`
      daysOfWeek.forEach(day => {
        layout[day.value] = equalWidth
      })
    }
    return layout
  }, [studentTabClassInfo])

  const getSubjectNameForStudentTab = (subjectId?: number) =>
    allSubjects.find(s => s.subject_id === subjectId)?.subject_name || ''
  const getSubjectColor = (subjectId: number) =>
    ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-pink-100'][subjectId % 5]

  const renderStudentHomeworkCell = (day: Date, sessions: MappedSession[]) => {
    const dayString = toDateString(day)
    const todayString = toDateString(now)
    const holidayName = studentTabHolidays.find(h => h.holiday_date === dayString)?.holiday_name
    const testsForDay = studentTabTests.filter(t => t.test_day === dayString)
    return (
      <>
        {holidayName && (
          <div className="text-xs font-semibold text-center text-red-700">{holidayName}</div>
        )}
        <div className="mt-1 space-y-1">
          {sessions.map(session => {
            const homeworksForThisSession = studentTabHomeworks.filter(
              hw => hw.curri_detail_id === session.curri_detail_id && hw.tag_name !== 'OVERDUE',
            )
            return (
              <div
                key={session.curri_detail_id}
                className={`p-1 text-xs rounded-sm ${getSubjectColor(session.subject_id)}`}
              >
                <p className="font-bold">{getSubjectNameForStudentTab(session.subject_id)}</p>
                <p className="text-gray-600 truncate">{session.progress}</p>
                {homeworksForThisSession.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-400/50">
                    {homeworksForThisSession.map(hw => {
                      const isChecked = studentTabCheckedHomeworks.some(
                        chk => chk.homework_id === hw.homework_id,
                      )
                      const dueDate = homeworkDueDatesMap[hw.homework_id]
                      const isDisabled =
                        (dueDate ? todayString < dueDate : false) || hw.tag_name === 'OVERDUE'
                      return (
                        <div key={hw.homework_id} className="flex items-start mt-1 space-x-1">
                          <Checkbox
                            id={`hw-${selectedStudent!.student_id}-${hw.homework_id}`}
                            checked={isChecked}
                            disabled={isDisabled}
                            onCheckedChange={checked =>
                              handleCheckChange(
                                selectedStudent!.student_id,
                                hw.homework_id,
                                selectedClassId!,
                                !!checked,
                                'student',
                              )
                            }
                            className="mt-0.5 flex-shrink-0"
                          />
                          <Label
                            htmlFor={`hw-${selectedStudent!.student_id}-${hw.homework_id}`}
                            className={`text-xs leading-tight ${
                              isDisabled ? 'text-gray-500 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            [{hw.tag_name}] {hw.homework_name}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {testsForDay.length > 0 && (
          <div className="absolute bottom-1 left-1/2 w-full px-1 -translate-x-1/2">
            {testsForDay.map(test => (
              <Badge key={test.test_id} tone="success" className="w-full text-xs">
                {test.test_title}
              </Badge>
            ))}
          </div>
        )}
      </>
    )
  }

  // ✨ 1. 메인 탭에 대한 데이터 배열 생성
  const mainTabs = [
    {
      id: 'my-homework-check',
      label: '내 숙제 확인',
      content: (
        <Card>
          <CardHeader title="오늘의 숙제 확인" />
          <CardContent className="space-y-4">
            {loadingMyTab && <Loading />}
            {error && !loadingMyTab && <p className="text-red-500">{error}</p>}
            {!loadingMyTab && !error && uniqueTodaysClasses.length === 0 && (
              <p>오늘은 확인할 숙제가 없습니다.</p>
            )}
            {!loadingMyTab && !error && uniqueTodaysClasses.length > 0 && (
              <div className="space-y-4">
                <Select
                  label="반 선택"
                  options={uniqueTodaysClasses.map(c => ({
                    value: String(c.class_id),
                    label: c.class_name || '',
                  }))}
                  value={String(selectedClassIdForMyTab || '')}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedClassIdForMyTab(Number(e.target.value))
                  }
                />
                {selectedMyClassData && selectedMyClassData.homeworks.length > 0 ? (
                  // ✨ 2. 과목별 탭을 위한 데이터 배열 생성 및 StyledTabs 적용
                  (() => {
                    const homeworksBySubject = selectedMyClassData.homeworks.reduce(
                      (acc, hw) => {
                        const key = hw.subject_name
                        if (!acc[key]) acc[key] = []
                        acc[key].push(hw)
                        return acc
                      },
                      {} as Record<string, typeof selectedMyClassData.homeworks>,
                    )

                    const subjectTabs = Object.keys(homeworksBySubject).map(subjectName => ({
                      id: subjectName,
                      label: subjectName,
                      content: (
                        <div className="my-6 p-6 border rounded-lg bg-white shadow-sm">
                          <h3 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">
                            📝 오늘의 숙제
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                            {homeworksBySubject[subjectName].map(hw => (
                              <Card key={hw.homework_id} className="transition-all hover:shadow-lg">
                                <CardHeader>
                                  <div>
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <Badge tone="primary" className="text-sm">
                                          {hw.tag_name}
                                        </Badge>
                                        <p className="text-lg font-semibold text-gray-900">
                                          {hw.homework_name}
                                        </p>
                                      </div>
                                      {(() => {
                                        const areAllChecked = selectedMyClassData.students.every(
                                          student =>
                                            selectedMyClassData.checked.some(
                                              chk =>
                                                chk.student_id === student.student_id &&
                                                chk.homework_id === hw.homework_id,
                                            ),
                                        )
                                        return (
                                          <Button
                                            size="sm"
                                            variant={areAllChecked ? 'outline' : 'primary'}
                                            onClick={() =>
                                              handleCheckAll(
                                                hw.homework_id,
                                                hw.subject_name,
                                                selectedClassIdForMyTab!,
                                                areAllChecked,
                                              )
                                            }
                                          >
                                            {areAllChecked ? '전체 해제' : '전체 체크'}
                                          </Button>
                                        )
                                      })()}
                                    </div>
                                    <p className="mt-2 text-base text-gray-600 pl-1">
                                      {hw.homework_contents}
                                    </p>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-2">
                                  <div className="border-t pt-4 space-y-1">
                                    {selectedMyClassData.students.map(student => {
                                      const isChecked = selectedMyClassData.checked.some(
                                        chk =>
                                          chk.student_id === student.student_id &&
                                          chk.homework_id === hw.homework_id,
                                      )
                                      return (
                                        <div
                                          key={student.student_id}
                                          className="flex items-center p-2 rounded-md transition-colors hover:bg-gray-100"
                                        >
                                          <Checkbox
                                            id={`my-hw-${hw.homework_id}-${student.student_id}`}
                                            checked={isChecked}
                                            onCheckedChange={checked =>
                                              handleCheckChange(
                                                student.student_id,
                                                hw.homework_id,
                                                selectedClassIdForMyTab!,
                                                !!checked,
                                                'my',
                                              )
                                            }
                                            className="flex-shrink-0"
                                          />
                                          <Label
                                            htmlFor={`my-hw-${hw.homework_id}-${student.student_id}`}
                                            className="ml-3 flex-grow cursor-pointer"
                                          >
                                            <span className="font-medium text-gray-900">
                                              {student.english_name || student.student_name}
                                            </span>
                                            {student.english_name && (
                                              <span className="text-xs text-gray-500 ml-2">
                                                ({student.student_name})
                                              </span>
                                            )}
                                          </Label>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ),
                    }))

                    return <StyledTabs tabs={subjectTabs} defaultTabId={subjectTabs[0]?.id} />
                  })()
                ) : (
                  <p>데이터를 불러오는 중이거나, 선택된 반에는 오늘 마감인 숙제가 없습니다.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'student-homework-check',
      label: '학생 숙제 확인',
      content: (
        <Card>
          <CardHeader title="학생 숙제 확인" />
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-search">학생 검색</Label>
              <Input
                id="student-search"
                placeholder="학생 이름으로 검색..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  if (selectedStudent) {
                    setSelectedStudent(null)
                    setSelectedClassId(null)
                  }
                }}
              />
              {searchTerm && studentSearchFiltered.length > 0 && (
                <div className="overflow-y-auto border rounded-md max-h-60">
                  {studentSearchFiltered.map(student => (
                    <div
                      key={student.student_id}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSelectedStudent(student)
                        setSearchTerm('')
                      }}
                    >
                      {student.english_name} ({student.student_name})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loadingStudentTab && <Loading />}
            {error && !loadingStudentTab && <p className="text-red-500">{error}</p>}

            {selectedStudent && !loadingStudentTab && (
              <div>
                <h3 className="mb-2 text-lg font-semibold">
                  {selectedStudent.student_name} 학생 숙제 현황
                </h3>
                {studentClasses.length > 0 ? (
                  // ✨ 3. 학생의 반별 탭을 위한 데이터 배열 생성 및 StyledTabs 적용
                  (() => {
                    const classTabs = studentClasses.map(c => ({
                      id: String(c.class_id),
                      label: c.class_name,
                      content: (
                        <ClassCalendar
                          calendarWeeks={studentTabCalendarWeeks}
                          mappedSessions={studentTabMappedSessions}
                          holidays={studentTabHolidays}
                          tests={studentTabTests}
                          columnLayout={studentTabColumnLayout}
                          renderCellContent={renderStudentHomeworkCell}
                        />
                      ),
                    }))

                    return (
                      <StyledTabs
                        key={selectedClassId} // 외부 상태와 연동하기 위한 key
                        tabs={classTabs}
                        defaultTabId={String(selectedClassId)}
                      />
                    )
                  })()
                ) : (
                  <p>선택된 학기에 수강중인 반이 없습니다.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-500">숙제 관리 기능</h2>
      <StyledTabs tabs={mainTabs} defaultTabId="my-homework-check" />
    </div>
  )
}

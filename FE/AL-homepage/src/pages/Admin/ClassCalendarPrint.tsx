import { useState, useEffect, useMemo, useCallback } from 'react'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import * as holidayApi from '../../api/holiday.api'
import type { Holiday } from '../../types/holiday'
import * as classApi from '../../api/class.api'
import type { ClassItem } from '../../types/class'
import * as subjectApi from '../../api/subject.api'
import type { Subject } from '../../types/subject'
import * as curriculumDetailApi from '../../api/curriculumDetail.api'
import type { CurriculumDetail } from '../../types/curriculumDetail'
import * as testApi from '../../api/test.api'
import type { Test } from '../../types/test'
import * as classtimeApi from '../../api/classtime.api'
import type { Classtime } from '../../types/classtime'
import { getClassTimetablePdf } from '../../api/report.api'
import Loading from '../../components/ui/Loading'
import ClassCalendar, { type MappedSession } from '../../components/ClassCalendar'
import Modal from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'

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

export default function ClassCalendarPrint() {
  const { selectedSemester, setTitle, setDescription, setActions } = usePageHeader()

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classInfo, setClassInfo] = useState<ClassItem | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [curriculumDetails, setCurriculumDetails] = useState<CurriculumDetail[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [selectedPdfFormat, setSelectedPdfFormat] = useState<'p' | 'l' | 'l2'>('l')
  const [classtimes, setClasstimes] = useState<Classtime[]>([])

  const selectedClass = useMemo(() => {
    return classes.find(c => c.class_id.toString() === selectedClassId)
  }, [classes, selectedClassId])

  const handleDownloadPdf = useCallback(async () => {
    if (
      !selectedClassId ||
      !selectedClass ||
      !selectedSemester ||
      !classInfo ||
      classtimes.length === 0
    ) {
      alert('반, 학기, 수업 정보 또는 시간표 정보가 필요합니다.')
      return
    }

    let firstClassStartTime = ''
    if (classInfo.schedule_details_json && classInfo.schedule_details_json.length > 0) {
      const classTimeIds = classInfo.schedule_details_json
        .map(detail => detail.classtime_id)
        .filter((id): id is number => id !== undefined)
      const relevantClasstimes = classtimes.filter(ct => classTimeIds.includes(ct.time_id))
      if (relevantClasstimes.length > 0) {
        firstClassStartTime = relevantClasstimes.reduce((minTime, currentClasstime) => {
          return currentClasstime.start_time < minTime ? currentClasstime.start_time : minTime
        }, relevantClasstimes[0].start_time)
      }
    }

    try {
      const pdfBlob = await getClassTimetablePdf(Number(selectedClassId), selectedPdfFormat)
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      const fileName = `${selectedClass.class_name}${firstClassStartTime ? `_${firstClassStartTime.substring(0, 5).replace(':', '')}` : ''}_수업캘린더.pdf`
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF 다운로드 실패:', error)
      alert('PDF 다운로드에 실패했습니다. 관리자에게 문의하세요.')
    } finally {
      setIsPdfModalOpen(false)
    }
  }, [selectedClassId, selectedPdfFormat, selectedClass, selectedSemester, classInfo, classtimes])

  const handleOpenPdfModal = useCallback(() => {
    if (!selectedClassId) {
      alert('반을 먼저 선택해주세요.')
      return
    }
    setIsPdfModalOpen(true)
  }, [selectedClassId])

  useEffect(() => {
    setTitle('수업 캘린더 출력')
    setDescription('반별 한 학기 수업 캘린더를 조회하고 PDF로 출력할 수 있습니다')
    setActions(
      <div className="flex gap-2">
        <Button onClick={handleOpenPdfModal} size="sm">
          📥 PDF 출력
        </Button>
      </div>,
    )

    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions, handleOpenPdfModal])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [holidayData, classData, subjectData, classtimeData] = await Promise.all([
          holidayApi.getAllHolidays(),
          classApi.getAllClasses(),
          subjectApi.getAllSubjects(),
          classtimeApi.getAllClasstimes(),
        ])
        setHolidays(holidayData)
        setClasses(classData)
        setSubjects(subjectData)
        setClasstimes(classtimeData)
      } catch (error) {
        console.error('데이터를 불러오는 데 실패했습니다:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchClassData = async () => {
      if (selectedClassId) {
        try {
          const classItem = await classApi.getClassById(Number(selectedClassId))
          setClassInfo(classItem)
          const allTestsData = await testApi.getAllTests({ class_id: Number(selectedClassId) })
          setTests(allTestsData)
          if (classItem.curriculum_id) {
            const detailsData = await curriculumDetailApi.getAllCurriculumDetails({
              curriculum_id: classItem.curriculum_id,
            })
            setCurriculumDetails(detailsData)
          }
        } catch (error) {
          console.error('클래스 데이터를 불러오는 데 실패했습니다:', error)
          setClassInfo(null)
          setCurriculumDetails([])
          setTests([])
        }
      } else {
        setClassInfo(null)
        setCurriculumDetails([])
        setTests([])
      }
    }
    fetchClassData()
  }, [selectedClassId])

  const columnLayout = useMemo(() => {
    if (!classInfo?.schedule_details_json) {
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
      const equalWidth = `${100 / daysOfWeek.length}%`
      daysOfWeek.forEach(day => {
        layout[day.value] = equalWidth
      })
    }
    return layout
  }, [classInfo])

  const mappedSessions = useMemo((): Record<string, MappedSession[]> => {
    if (!selectedSemester || !classInfo?.schedule_details_json || curriculumDetails.length === 0) {
      return {}
    }

    const sessions: Record<string, MappedSession[]> = {}
    const subjectDayCounters: { [key: number]: number } = {}

    classInfo.schedule_details_json.forEach(detail => {
      if (detail.subject_id) subjectDayCounters[detail.subject_id] = 1
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
          detail => detail.weekday.toUpperCase() === dayOfWeek.toUpperCase(),
        )
        subjectsForDay.forEach(schedule => {
          if (schedule.subject_id) {
            const dayCount = subjectDayCounters[schedule.subject_id]
            const curriculumDetailForDay = curriculumDetails.find(
              cd => cd.subject_id === schedule.subject_id && cd.day === dayCount,
            )
            if (curriculumDetailForDay) {
              if (!sessions[dateString]) sessions[dateString] = []
              sessions[dateString].push({
                subject_id: schedule.subject_id,
                day: dayCount,
                progress: curriculumDetailForDay.progress,
                curri_detail_id: curriculumDetailForDay.curri_detail_id,
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

  const getSubjectColor = (subjectId: number) => {
    const colors = [
      'bg-blue-100',
      'bg-green-100',
      'bg-yellow-100',
      'bg-purple-100',
      'bg-pink-100',
      'bg-indigo-100',
    ]
    return colors[subjectId % colors.length]
  }

  const getSubjectName = (subject_id: number | undefined) => {
    if (!subject_id) return '알 수 없음'
    const subject = subjects.find(s => s.subject_id === subject_id)
    return subject ? subject.subject_name : '알 수 없음'
  }

  const renderPrintCalendarCell = (day: Date, sessions: MappedSession[]) => {
    const dayString = formatDate(day)
    const testsForDay = tests.filter(t => t.test_day === dayString)
    const holidayName = holidays.find(h => h.holiday_date === dayString)?.holiday_name

    return (
      <>
        {holidayName && (
          <div className="text-xs font-semibold mt-1 text-center text-red-700">{holidayName}</div>
        )}
        <div className="text-xs mt-1 space-y-1">
          {sessions.map((session, sessionIdx) => (
            <div
              key={sessionIdx}
              className={`p-1 rounded-sm text-left ${getSubjectColor(session.subject_id)}`}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-800 truncate">
                  {getSubjectName(session.subject_id)}
                </p>
                <p className="text-gray-600 font-semibold">Day {session.day}</p>
              </div>
              <p className="text-xs text-gray-700 truncate mt-1">{session.progress}</p>
            </div>
          ))}
        </div>
        {testsForDay.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-full px-1">
            {testsForDay.map(test => (
              <Badge key={test.test_id} tone="success" className="text-xs w-full truncate">
                {test.test_title}
              </Badge>
            ))}
          </div>
        )}
      </>
    )
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="반 선택"
          options={[
            { value: '', label: '반 선택' },
            ...classes.map(cls => ({
              value: cls.class_id.toString(),
              label: cls.class_name,
            })),
          ]}
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
        />
      </div>

      {selectedSemester && selectedClass ? (
        <Card>
          <CardHeader
            title={`${selectedClass.class_name} - ${selectedSemester.semester_name} 캘린더`}
            subtitle={`${formatDate(
              new Date(selectedSemester.semester_start_at),
            )} ~ ${formatDate(new Date(selectedSemester.semester_end_at))}`}
          />
          <CardContent>
            <h3 className="text-lg font-semibold mb-4 text-center">
              {selectedClass.class_name} ({selectedSemester.semester_name}) 수업 일정
            </h3>
            <ClassCalendar
              calendarWeeks={calendarWeeks}
              mappedSessions={mappedSessions}
              holidays={holidays}
              tests={tests}
              columnLayout={columnLayout}
              renderCellContent={renderPrintCalendarCell}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center p-8 text-gray-500">
            <p>캘린더를 보려면 먼저 반을 선택해주세요.</p>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="PDF 레이아웃 선택"
        description="원하는 PDF 출력 형식을 선택하세요."
      >
        <div className="space-y-4">
          <Select
            label="레이아웃"
            options={[
              { value: 'p', label: '세로 (Portrait)' },
              { value: 'l', label: '가로 1열 (Landscape)' },
              { value: 'l2', label: '가로 2열 (Landscape 2-column)' },
            ]}
            value={selectedPdfFormat}
            onChange={e => setSelectedPdfFormat(e.target.value as 'p' | 'l' | 'l2')}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsPdfModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleDownloadPdf}>확인</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

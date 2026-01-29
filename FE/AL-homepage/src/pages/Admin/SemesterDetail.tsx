import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { getSemesterById, updateSemester, deleteSemester } from '../../api/semester.api'
import { getAllBranches, type Branch } from '../../api/branch.api'
import * as holidayApi from '../../api/holiday.api'
import { useSemesterStore } from '../../store/semesterStore'
import type { Holiday } from '../../types/holiday'
import type { Semester } from '../../types/semester'
import { SemesterStatus } from '../../types/semester'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

import Loading from '../../components/ui/Loading'
import { Badge } from '../../components/ui/Badge'

// Helper function for status badge
const getSemesterStatusBadge = (status: SemesterStatus) => {
  switch (status) {
    case SemesterStatus.Upcoming:
      return <Badge tone="primary">Upcoming</Badge>
    case SemesterStatus.InProgress:
      return <Badge tone="success">In Progress</Badge>
    case SemesterStatus.Completed:
      return <Badge tone="neutral">Finished</Badge>
    default:
      return <Badge tone="neutral">Unknown</Badge>
  }
}

const SemesterDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const semesterId = Number(id)

  const { setTitle, setDescription, setActions, setEntityName } = usePageHeader()
  const { setSelectedSemester } = useSemesterStore()

  const [semester, setSemester] = useState<Semester | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentSemesterData, setCurrentSemesterData] = useState<{
    branch_id: string
    semester_name: string
    semester_start_at: string
    semester_end_at: string
    season: Semester['season']
    status?: SemesterStatus
  } | null>(null)
  const [newHolidayName, setNewHolidayName] = useState('')
  const [newHolidayDate, setNewHolidayDate] = useState('')

  // 입력 필드 변경 핸들러
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setCurrentSemesterData(prev => {
        if (!prev) return null
        return {
          ...prev,
          [name]: name === 'status' ? Number(value) : value,
        }
      })
    },
    [],
  )

  // 학기 정보 저장 핸들러
  const handleSubmit = useCallback(async () => {
    if (!semester || !currentSemesterData) return

    try {
      await updateSemester(semester.semester_id, {
        branch_id: Number(currentSemesterData.branch_id),
        semester_name: currentSemesterData.semester_name,
        semester_start_at: currentSemesterData.semester_start_at,
        semester_end_at: currentSemesterData.semester_end_at,
        season: currentSemesterData.season,
        status: currentSemesterData.status,
      })
      setIsEditMode(false)
      // 변경된 데이터를 다시 불러와 UI를 최신화
      const updatedSemester = await getSemesterById(semester.semester_id)
      setSemester(updatedSemester)
      setSelectedSemester(updatedSemester) // 전역 상태 업데이트
      setCurrentSemesterData({
        branch_id: updatedSemester.branch_id.toString(),
        semester_name: updatedSemester.semester_name,
        semester_start_at: updatedSemester.semester_start_at,
        semester_end_at: updatedSemester.semester_end_at,
        season: updatedSemester.season,
        status: updatedSemester.status,
      })
    } catch (err) {
      console.error('Failed to update semester:', err)
      setError('학기 정보 업데이트에 실패했습니다. 입력 내용을 확인해주세요.')
    }
  }, [semester, currentSemesterData, setSelectedSemester])

  // 학기 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (window.confirm('정말로 이 학기를 삭제하시겠습니까?')) {
      try {
        await deleteSemester(semesterId)
        navigate('/admin/semesters')
      } catch (err) {
        console.error('Failed to delete semester:', err)
        setError('학기 삭제에 실패했습니다.')
      }
    }
  }, [semesterId, navigate])

  const fetchSemesterData = useCallback(async () => {
    if (isNaN(semesterId)) {
      setError('유효하지 않은 학기 ID입니다.')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [semesterData, branchData, holidayData] = await Promise.all([
        getSemesterById(semesterId),
        getAllBranches(),
        holidayApi.getAllHolidays(),
      ])
      setSemester(semesterData)
      setBranches(branchData)
      setHolidays(holidayData)
      setCurrentSemesterData({
        branch_id: semesterData.branch_id.toString(),
        semester_name: semesterData.semester_name,
        semester_start_at: semesterData.semester_start_at,
        semester_end_at: semesterData.semester_end_at,
        season: semesterData.season,
        status: semesterData.status,
      })
    } catch (err) {
      console.error('Failed to fetch semester data:', err)
      setError('학기 정보를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [semesterId])

  useEffect(() => {
    fetchSemesterData()
  }, [fetchSemesterData])

  useEffect(() => {
    if (semester) {
      setTitle(`${semester.semester_name} 상세`)
      setDescription('학기 상세 정보를 확인하고 관리합니다.')
      setActions(
        <>
          <Button onClick={() => navigate('/admin/semesters')} variant="outline">
            목록으로
          </Button>
          {!isEditMode && (
            <Button onClick={() => setIsEditMode(true)} className="mr-2">
              수정
            </Button>
          )}
          {isEditMode && (
            <Button onClick={handleSubmit} className="mr-2">
              저장
            </Button>
          )}
          <Button onClick={handleDelete} variant="danger">
            삭제
          </Button>
        </>,
      )
      if (setEntityName) setEntityName(semester.semester_name)
    }

    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
      if (setEntityName) setEntityName(undefined)
    }
  }, [
    semester,
    isEditMode,
    setTitle,
    setDescription,
    setActions,
    setEntityName,
    handleSubmit,
    handleDelete,
    navigate,
  ])

  const handleAddHoliday = async () => {
    if (!semester) return
    if (!newHolidayName || !newHolidayDate) {
      alert('휴일 이름과 날짜를 모두 입력해주세요.')
      return
    }
    try {
      await holidayApi.createHoliday({
        holiday_name: newHolidayName,
        holiday_date: newHolidayDate,
      })
      setNewHolidayName('')
      setNewHolidayDate('')
      const updatedHolidays = await holidayApi.getAllHolidays()
      setHolidays(updatedHolidays)
    } catch (err) {
      console.error('휴일 추가에 실패했습니다:', err)
      alert('휴일 추가에 실패했습니다. 날짜 형식을 확인하거나 이미 등록된 휴일인지 확인해주세요.')
    }
  }

  const handleDeleteHoliday = async (holidayId: number) => {
    if (window.confirm('정말로 이 휴일을 삭제하시겠습니까?')) {
      try {
        await holidayApi.deleteHoliday(holidayId)
        const updatedHolidays = await holidayApi.getAllHolidays()
        setHolidays(updatedHolidays)
      } catch (err) {
        console.error('휴일 삭제에 실패했습니다:', err)
        alert('휴일 삭제에 실패했습니다.')
      }
    }
  }

  const filteredHolidays = useMemo(() => {
    if (!semester) return []

    const semesterStart = new Date(semester.semester_start_at)
    const semesterEnd = new Date(semester.semester_end_at)

    return holidays
      .filter((holiday: Holiday) => {
        const holidayDate = new Date(holiday.holiday_date)
        return holidayDate >= semesterStart && holidayDate <= semesterEnd
      })
      .sort(
        (a: Holiday, b: Holiday) =>
          new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime(),
      )
  }, [holidays, semester])

  if (loading || !currentSemesterData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loading />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={() => navigate('/admin/semesters')} className="mt-4">
                목록으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const branchOptions = branches.map((b: Branch) => ({
    value: b.branch_id.toString(),
    label: b.branch_name,
  }))
  const seasonOptions = [
    { value: 'Spring', label: '봄' },
    { value: 'Summer', label: '여름' },
    { value: 'Fall', label: '가을' },
    { value: 'Winter', label: '겨울' },
  ]
  const statusOptions = [
    { value: String(SemesterStatus.Upcoming), label: '준비 (Upcoming)' },
    { value: String(SemesterStatus.InProgress), label: '진행 (In Progress)' },
    { value: String(SemesterStatus.Completed), label: '지남 (Completed)' },
  ]

  return (
    <div className="flex space-x-6">
      {/* Left Pane: Semester Details */}
      <div className="w-1/2 space-y-6">
        <Card>
          <CardHeader title="학기 상세 정보" />
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700 mb-1">
                지점
              </label>
              <Select
                id="branch_id"
                name="branch_id"
                value={currentSemesterData.branch_id}
                onChange={handleInputChange}
                options={branchOptions}
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label
                htmlFor="semester_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                학기명
              </label>
              <Input
                id="semester_name"
                name="semester_name"
                value={currentSemesterData.semester_name}
                onChange={handleInputChange}
                placeholder="예: 2024 여름 학기"
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label
                htmlFor="semester_start_at"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                시작일
              </label>
              <Input
                id="semester_start_at"
                name="semester_start_at"
                type="date"
                value={currentSemesterData.semester_start_at}
                onChange={handleInputChange}
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label
                htmlFor="semester_end_at"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                종료일
              </label>
              <Input
                id="semester_end_at"
                name="semester_end_at"
                type="date"
                value={currentSemesterData.semester_end_at}
                onChange={handleInputChange}
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
                시즌
              </label>
              <Select
                id="season"
                name="season"
                value={currentSemesterData.season}
                onChange={handleInputChange}
                options={seasonOptions}
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              {isEditMode ? (
                <Select
                  id="status"
                  name="status"
                  value={String(currentSemesterData.status)}
                  onChange={handleInputChange} // 이제 handleInputChange가 상태까지 처리합니다.
                  options={statusOptions}
                  disabled={!isEditMode}
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {semester && getSemesterStatusBadge(semester.status)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="해당 학기 휴일 목록" />
          <CardContent>
            {isEditMode && (
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="휴일 이름"
                  value={newHolidayName}
                  onChange={e => setNewHolidayName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={newHolidayDate}
                  onChange={e => setNewHolidayDate(e.target.value)}
                  className="w-auto"
                />
                <Button onClick={handleAddHoliday}>추가</Button>
              </div>
            )}
            {filteredHolidays.length > 0 ? (
              <ul className="space-y-2">
                {filteredHolidays.map((holiday: Holiday) => (
                  <li
                    key={holiday.holiday_id}
                    className="flex justify-between items-center text-sm text-gray-700"
                  >
                    <span>{holiday.holiday_name}</span>
                    <span className="text-gray-500">{holiday.holiday_date}</span>
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteHoliday(holiday.holiday_id)}
                      >
                        삭제
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">등록된 휴일이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Pane: Semester Checklist (Placeholder) */}
      <div className="w-1/2 space-y-6">
        <Card>
          <CardHeader title="학기 체크리스트" />
          <CardContent className="text-gray-500">
            <p>추후 개발 예정입니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SemesterDetail

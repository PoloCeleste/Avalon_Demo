import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom' // Import useNavigate
import type { Semester } from '../../types/semester'
import { SemesterStatus } from '../../types/semester'
import { getAllSemesters, createSemester, deleteSemester } from '../../api/semester.api'
import { getAllBranches, type Branch } from '../../api/branch.api'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { useSemesterStore } from '../../store/semesterStore'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import Modal from '../../components/ui/Modal' // Keep Modal for new semester creation
import { Input } from '../../components/ui/Input' // Keep Input for new semester creation
import { Badge } from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading'

const SemestersPage = () => {
  const { setTitle, setDescription, setActions } = usePageHeader()
  const navigate = useNavigate() // Initialize useNavigate
  const { resetSemesters } = useSemesterStore()

  const [semesters, setSemesters] = useState<Semester[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialMount = useRef(true)

  // State for new semester creation modal
  const [isNewSemesterModalOpen, setIsNewSemesterModalOpen] = useState(false)
  const [newSemesterData, setNewSemesterData] = useState<{
    branch_id: string
    semester_name: string
    semester_start_at: string
    semester_end_at: string
    season: Semester['season']
    status?: SemesterStatus
  }>({
    branch_id: '',
    semester_name: '',
    semester_start_at: '',
    semester_end_at: '',
    season: 'Spring',
    status: SemesterStatus.Upcoming,
  })

  const openNewSemesterModal = useCallback(() => {
    if (branches.length > 0) {
      setNewSemesterData(prev => ({
        ...prev,
        branch_id: branches[0].branch_id.toString(),
        semester_name: '',
        semester_start_at: '',
        semester_end_at: '',
        season: 'Spring',
        status: SemesterStatus.Upcoming,
      }))
    } else {
      setNewSemesterData({
        branch_id: '',
        semester_name: '',
        semester_start_at: '',
        semester_end_at: '',
        season: 'Spring',
        status: SemesterStatus.Upcoming,
      })
    }
    setIsNewSemesterModalOpen(true)
  }, [branches])

  useEffect(() => {
    setTitle('학기 관리')
    setDescription('학기를 등록하고 관리합니다.')
    setActions(<Button onClick={openNewSemesterModal}>➕ 새 학기 등록</Button>)

    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions, openNewSemesterModal])

  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        limit: 1000,
        branch_id: selectedBranch === 'all' ? undefined : Number(selectedBranch),
      }
      const data = await getAllSemesters(params)
      setSemesters(data.sort((a, b) => b.semester_id - a.semester_id))
    } catch (err) {
      setError('Failed to fetch semesters.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedBranch])

  // Initial data fetch - runs only once on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const [semesterData, branchData] = await Promise.all([
          getAllSemesters({ limit: 1000 }),
          getAllBranches(),
        ])
        setSemesters(semesterData.sort((a, b) => b.semester_id - a.semester_id))
        setBranches(branchData)
        if (branchData.length > 0) {
          setNewSemesterData(prev => ({
            ...prev,
            branch_id: branchData[0].branch_id.toString(),
          }))
        }
      } catch (err) {
        setError('Failed to fetch initial data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // Fetch semesters when branch selection changes, but skip the initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    } else {
      fetchSemesters()
    }
  }, [selectedBranch, fetchSemesters])

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

  const handleNewSemesterInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setNewSemesterData(prev => ({
      ...prev,
      [name]: name === 'season' ? (value as Semester['season']) : value,
    }))
  }

  const handleNewSemesterSubmit = async () => {
    if (
      !newSemesterData.branch_id ||
      !newSemesterData.semester_name ||
      !newSemesterData.semester_start_at ||
      !newSemesterData.semester_end_at
    ) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    try {
      await createSemester({
        ...newSemesterData,
        branch_id: Number(newSemesterData.branch_id),
        season: newSemesterData.season as Semester['season'],
      })

      // Invalidate the global semester state so it refetches on next navigation
      resetSemesters()

      // Refetch for the current page
      fetchSemesters()

      setIsNewSemesterModalOpen(false)
      setNewSemesterData({
        branch_id: branches.length > 0 ? branches[0].branch_id.toString() : '',
        semester_name: '',
        semester_start_at: '',
        semester_end_at: '',
        season: 'Spring',
        status: SemesterStatus.Upcoming,
      })
    } catch (err) {
      console.error('Failed to create semester', err)
      setError('학기 생성에 실패했습니다. 입력 내용을 확인해주세요.')
    }
  }

  // ... (rest of the component)

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
      try {
        await deleteSemester(id)
        fetchSemesters()
      } catch (err) {
        console.error('Failed to delete semester', err)
      }
    }
  }

  if (loading && !semesters.length) {
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
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const branchOptions = [
    { value: 'all', label: '전체' },
    ...branches.map((b: Branch) => ({ value: b.branch_id.toString(), label: b.branch_name })),
  ]

  const newSemesterBranchOptions = branches.map((b: Branch) => ({
    value: b.branch_id.toString(),
    label: b.branch_name,
  }))
  const seasonOptions = [
    { value: 'Spring', label: '봄' },
    { value: 'Summer', label: '여름' },
    { value: 'Fall', label: '가을' },
    { value: 'Winter', label: '겨울' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xs">
          <Select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            options={branchOptions}
          />
        </div>
      </div>

      <Card>
        <CardHeader title="학기 목록" subtitle={`총 ${semesters.length}개의 학기`} />
        <CardContent>
          {semesters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {selectedBranch === 'all'
                ? '등록된 학기가 없습니다.'
                : '해당 지점에 학기가 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      학기명
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      지점
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      시작일
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      종료일
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      시즌
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      상태
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map((semester: Semester) => (
                    <tr
                      key={semester.semester_id}
                      className="border-b border-gray-100 hover:bg-gray-200 even:bg-gray-100"
                    >
                      <td className="py-3 px-4 font-medium">{semester.semester_name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {branches.find((b: Branch) => b.branch_id === semester.branch_id)
                          ?.branch_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{semester.semester_start_at}</td>
                      <td className="py-3 px-4 text-gray-600">{semester.semester_end_at}</td>
                      <td className="py-3 px-4 text-gray-600">{semester.season}</td>
                      <td className="py-3 px-4">{getSemesterStatusBadge(semester.status)}</td>
                      <td className="py-3 px-4">
                        <Button
                          onClick={() => navigate(`/admin/semesters/${semester.semester_id}`)} // Navigate to detail page
                          size="sm"
                          variant="ghost"
                          className="mr-2"
                        >
                          상세
                        </Button>
                        <Button
                          onClick={() => handleDelete(semester.semester_id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Semester Creation Modal */}
      <Modal
        isOpen={isNewSemesterModalOpen}
        onClose={() => setIsNewSemesterModalOpen(false)}
        title="새 학기 등록"
        footer={
          <>
            <Button variant="subtle" onClick={() => setIsNewSemesterModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleNewSemesterSubmit}>등록</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="new_branch_id" className="block text-sm font-medium text-gray-700 mb-1">
              지점
            </label>
            <Select
              id="new_branch_id"
              name="branch_id"
              value={newSemesterData.branch_id}
              onChange={handleNewSemesterInputChange}
              options={newSemesterBranchOptions}
            />
          </div>
          <div>
            <label
              htmlFor="new_semester_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              학기명
            </label>
            <Input
              id="new_semester_name"
              name="semester_name"
              value={newSemesterData.semester_name}
              onChange={handleNewSemesterInputChange}
              placeholder="예: 2024 여름 학기"
            />
          </div>
          <div>
            <label
              htmlFor="new_semester_start_at"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              시작일
            </label>
            <Input
              id="new_semester_start_at"
              name="semester_start_at"
              type="date"
              value={newSemesterData.semester_start_at}
              onChange={handleNewSemesterInputChange}
            />
          </div>
          <div>
            <label
              htmlFor="new_semester_end_at"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              종료일
            </label>
            <Input
              id="new_semester_end_at"
              name="semester_end_at"
              type="date"
              value={newSemesterData.semester_end_at}
              onChange={handleNewSemesterInputChange}
            />
          </div>
          <div>
            <label htmlFor="new_season" className="block text-sm font-medium text-gray-700 mb-1">
              시즌
            </label>
            <Select
              id="new_season"
              name="season"
              value={newSemesterData.season}
              onChange={handleNewSemesterInputChange}
              options={seasonOptions}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SemestersPage

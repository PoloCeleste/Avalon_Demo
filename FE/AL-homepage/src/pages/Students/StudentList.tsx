// src/pages/Students/StudentList.tsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ROLES } from '../../utils/roles'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { getAllStudents } from '../../api/student.api'
import type { Student, StudentStatus } from '../../types/student'
import { Badge } from '../../components/ui/Badge' // Badge import

const gradeMap: { [key: number]: string } = {
  1: '유치부 5세',
  2: '유치부 6세',
  3: '유치부 7세',
  4: '1학년 (초)',
  5: '2학년 (초)',
  6: '3학년 (초)',
  7: '4학년 (초)',
  8: '5학년 (초)',
  9: '6학년 (초)',
  10: '1학년 (중)',
  11: '2학년 (중)',
  12: '3학년 (중)',
  13: '1학년 (고)',
  14: '2학년 (고)',
  15: '3학년 (고)',
}

export default function StudentList() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { setDescription, setActions } = usePageHeader()

  const canAddStudent = user && user.role !== ROLES.TEACHER

  const handleNavigateToNewStudent = useCallback(() => {
    navigate('/students/new')
  }, [navigate])

  useEffect(() => {
    setDescription('등록된 학생들의 정보를 확인하고 관리할 수 있습니다')
    setActions(
      canAddStudent ? <Button onClick={handleNavigateToNewStudent}>➕ 학생 등록</Button> : null,
    )

    return () => {
      setDescription(undefined)
      setActions(undefined)
    }
  }, [canAddStudent, setDescription, setActions, handleNavigateToNewStudent])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const studentsData = await getAllStudents()
        setStudents(studentsData)
      } catch (err) {
        setError('학생 목록을 불러오는 데 실패했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const filteredStudents = students.filter(student =>
    [student.student_name, student.english_name, student.school].some(field =>
      field?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩중...</p>
            </div>
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

  const getGradeDisplayName = (s_year: number | null) => {
    if (s_year === null || s_year === undefined) return '-'
    return gradeMap[s_year] || `${s_year}`
  }

  return (
    <div className="space-y-6">
      {/* 검색 */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="학생 이름, 영어 이름, 학교로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 학생 목록 */}
      <Card>
        <CardHeader title="학생 목록" subtitle={`총 ${filteredStudents.length}명의 학생`} />
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      이름
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      학교
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      학년
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">
                      학부모 연락처
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
                  {filteredStudents.map(student => (
                    <tr
                      key={student.student_id}
                      className="border-b border-gray-100 hover:bg-gray-200 even:bg-gray-100"
                    >
                      <td className="py-3 px-4 font-medium">
                        {student.english_name} ({student.student_name})
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.school || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {getGradeDisplayName(student.s_year)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.parent_phone || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge tone={getBadgeToneForStatus(student.status)}>
                          {getStatusDisplayName(student.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/students/${student.student_id}`)}
                        >
                          상세보기
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
    </div>
  )
}

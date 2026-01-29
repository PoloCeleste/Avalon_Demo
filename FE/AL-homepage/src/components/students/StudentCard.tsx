// src/components/students/StudentCard.tsx

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Progress } from '../ui/Progress'

// ✨ 1. Props 타입 수정: subjectRates 추가 및 studentId 추가
interface SubjectRate {
  subject_name: string
  teacher_name: string
  completion_rate: number
}

interface Props {
  studentId: number // 페이지 이동을 위해 ID 추가
  englishName: string
  studentName: string
  overallRate: number
  subjectRates?: SubjectRate[] // 과목별 진척도 배열
}

export default function StudentCard({
  studentId,
  studentName,
  englishName,
  overallRate,
  subjectRates,
}: Props) {
  const navigate = useNavigate()

  // ✨ 2. 카드 클릭 시 학생 상세 페이지로 이동하는 핸들러 추가
  const handleCardClick = () => {
    navigate(`/students/${studentId}`)
  }

  return (
    // ✨ 3. onClick 핸들러 추가 및 cursor-pointer 클래스 추가
    <Card onClick={handleCardClick} className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>
          {englishName} ({studentName})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전체 숙제 진척도 (기존과 동일) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium text-gray-700">전체 숙제 진척도</h4>
            <span className="text-sm font-bold text-blue-600">{overallRate.toFixed(1)}%</span>
          </div>
          <Progress value={overallRate} className="h-2" />
        </div>

        {/* ✨ 4. 과목별 세부 진척도 UI 수정 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">과목별 세부 진척도</h4>
          {subjectRates && subjectRates.length > 0 ? (
            <div className="space-y-3 text-sm">
              {subjectRates.map(subject => (
                <div key={subject.subject_name}>
                  <div className="flex justify-between items-center mb-1">
                    <p>
                      <span className="font-semibold text-gray-800">{subject.subject_name}</span>
                      <span className="text-xs text-gray-500 ml-2">({subject.teacher_name})</span>
                    </p>
                    <span className="font-bold text-gray-700">
                      {subject.completion_rate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={subject.completion_rate} className="h-1.5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500">(상세 데이터가 없습니다)</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

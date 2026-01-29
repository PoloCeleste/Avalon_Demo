// src/components/dashboard/AverageCompletionWidget.tsx

// import React from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card' // 경로에 맞게 수정
import type { LowPerformanceStudent } from '../../types/report' // 경로에 맞게 수정

interface Props {
  students: LowPerformanceStudent[]
}

export default function AverageCompletionWidget({ students }: Props) {
  return (
    <Card>
      <CardHeader title="평균 숙제 완성률 (70% 미만) 학생" />
      <CardContent>
        {students.length > 0 ? (
          <div className="space-y-3">
            {students.map(student => (
              <div
                key={student.rank}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
              >
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center font-bold text-gray-500 w-6 h-6 bg-gray-200 rounded-full">
                    {student.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">{student.student_name}</p>
                    <p className="text-xs text-gray-500">
                      {student.homeroom_teacher} / {student.class_name}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-red-600 text-lg">
                  {student.overall_completion_rate.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">데이터가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}

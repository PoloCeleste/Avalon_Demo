import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface HomeworkProgressCardProps {
  student_name: string
  completion_rate: number
  completed_homework: number
  total_homework: number
}

const HomeworkProgressCard = ({
  student_name,
  completion_rate,
  completed_homework,
  total_homework,
}: HomeworkProgressCardProps) => {
  const isRecommended = completion_rate >= 90

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{student_name}</span>
          {isRecommended && (
            <span className="text-sm font-medium text-blue-500">추천</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${completion_rate}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>진척도: {completion_rate.toFixed(1)}%</span>
            <span>
              {completed_homework} / {total_homework}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default HomeworkProgressCard

// src/pages/NotFound.tsx
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center px-6">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-600">
            요청하신 페이지가 존재하지 않거나
            <br />
            이동되었을 수 있습니다.
          </p>
        </div>

        <div className="space-y-3">
          <Button block onClick={() => navigate('/')}>
            홈으로 돌아가기
          </Button>
          <Button variant="outline" block onClick={() => navigate(-1)}>
            이전 페이지로
          </Button>
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react' // useEffect 추가
import { useAuthStore } from '../../store/authStore'
import { usePageHeader } from '../../contexts/PageHeaderContext' // 1. usePageHeader 훅 import
// import PageHeader from '../../components/page/PageHeader' // 2. PageHeader 직접 import 제거
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function BranchesPage() {
  const user = useAuthStore(s => s.user)
  // 3. usePageHeader 훅 호출
  const { setTitle, setDescription, setActions } = usePageHeader()

  // 4. useEffect를 사용하여 헤더 내용 설정
  useEffect(() => {
    setTitle('지점 관리') // 제목 추가
    setDescription('학원 지점 정보를 관리할 수 있습니다')
    setActions(
      <Button variant="outline" disabled>
        🏢 지점 추가 
      </Button>,
    )

    // 5. 페이지를 벗어날 때 헤더 내용 초기화
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions])

  return (
    // 6. 기존 PageHeader 컴포넌트 제거
    <div className="space-y-6">
      {/* 현재 지점 정보 */}
      <Card>
        <CardHeader title="현재 운영 지점" subtitle="현재 시스템에서 관리하는 지점 정보" />
        <CardContent>
          <div className="max-w-md">
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🏢</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">본점</h3>
                <p className="text-sm text-gray-600">지점 ID: 1</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">운영 중</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>현재 사용자:</strong> {user?.name || user?.username} ({user?.role})
              </p>
              <p className="text-xs text-gray-500">현재 단일 지점 운영 모드로 설정되어 있습니다.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

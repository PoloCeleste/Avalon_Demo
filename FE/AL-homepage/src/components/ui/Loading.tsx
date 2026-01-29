// src/components/ui/Loading.tsx
export default function Loading() {
  return (
    <div className="flex w-full items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="text-gray-600 text-lg">계산 중입니다...</p>
      </div>
    </div>
  )
}

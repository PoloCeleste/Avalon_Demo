import type { Test } from '../types/test'
import type { Holiday } from '../types/holiday'
// import { Badge } from './ui/Badge'
import React from 'react'

export interface MappedSession {
  subject_id: number
  day: number
  progress: string
  curri_detail_id: number
}

interface ClassCalendarProps {
  calendarWeeks: Date[][]
  mappedSessions: Record<string, MappedSession[]>
  tests: Test[]
  holidays: Holiday[] // 휴일 정보는 이미 prop으로 받고 있습니다.
  columnLayout: Record<string, string>
  renderCellContent: (day: Date, sessions: MappedSession[]) => React.ReactNode
}

const daysOfWeek = [
  { value: 'Mon', label: '월' },
  { value: 'Tue', label: '화' },
  { value: 'Wed', label: '수' },
  { value: 'Thu', label: '목' },
  { value: 'Fri', label: '금' },
]

export default function ClassCalendar({
  calendarWeeks,
  mappedSessions,
  holidays, // holidays prop을 사용합니다.
  columnLayout,
  renderCellContent,
}: ClassCalendarProps) {
  // [추가] 휴일 여부를 판단하는 헬퍼 함수를 컴포넌트 내부에 다시 정의합니다.
  const getHolidayName = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return holidays.find(h => h.holiday_date === dateString)?.holiday_name || null
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full w-full bg-white border border-gray-200 table-fixed">
        <thead>
          <tr>
            {daysOfWeek.map(day => (
              <th
                key={day.value}
                className="text-center py-3 px-4 font-medium text-gray-700 bg-gray-100 border-b"
                style={{ width: columnLayout[day.value] }}
              >
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendarWeeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {daysOfWeek.map(dayInfo => {
                const day = week.find(
                  d =>
                    (d.getDay() === 0 ? 7 : d.getDay()) ===
                    daysOfWeek.findIndex(dw => dw.value === dayInfo.value) + 1,
                )

                if (!day) {
                  return (
                    <td
                      key={dayInfo.value}
                      className="border-b border-r"
                      style={{ width: columnLayout[dayInfo.value] }}
                    />
                  )
                }

                // [수정] 렌더링 전에 휴일 여부를 미리 계산합니다.
                const isHoliday = !!getHolidayName(day)
                const dayString = day.toISOString().split('T')[0]
                const sessionsForDay = mappedSessions[dayString] || []

                return (
                  <td
                    key={dayInfo.value}
                    // [수정] className에 휴일일 경우 배경색을 적용하는 조건부 스타일을 추가합니다.
                    className={`py-2 px-2 border-b border-r align-top relative h-40 ${
                      isHoliday ? 'bg-red-50' : ''
                    }`}
                    style={{ width: columnLayout[dayInfo.value] }}
                  >
                    <div className="text-sm font-medium text-center">{`${day.getMonth() + 1}/${day.getDate()}`}</div>
                    {/* 셀 렌더링은 부모에게 받은 함수로 동일하게 처리 */}
                    {renderCellContent(day, sessionsForDay)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

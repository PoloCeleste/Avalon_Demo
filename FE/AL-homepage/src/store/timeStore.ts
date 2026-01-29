import { create } from 'zustand'

interface TimeState {
  overrideDate: Date | null
  now: Date
  setNow: (newDate: Date) => void
  resetTime: () => void
}

export const useTimeStore = create<TimeState>((set) => ({
  overrideDate: null,
  now: new Date(), // 초기값은 실제 현재 시간

  setNow: (newDate: Date) => {
    set({ overrideDate: newDate, now: newDate })
  },

  resetTime: () => {
    set({ overrideDate: null, now: new Date() })
  },
}))

// 1초마다 현재 시간을 업데이트하는 로직 (선택 사항)
// 실제 시간이 흐르는 것처럼 보이게 하고 싶을 때 유용합니다.
setInterval(() => {
  const { overrideDate } = useTimeStore.getState()
  if (!overrideDate) {
    useTimeStore.setState({ now: new Date() })
  }
}, 1000)

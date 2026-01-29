// src/store/semesterStore.ts
import { create } from 'zustand'
import { type Semester, SemesterStatus } from '../types/semester'
import { getAllSemesters } from '../api/semester.api'

interface SemesterState {
  semesters: Semester[]
  selectedSemester: Semester | null
  semestersFetched: boolean // 학기 정보 로드 시도 여부
  fetchSemesters: (branch_id?: number) => Promise<void>
  setSelectedSemester: (semester: Semester | null) => void
  resetSemesters: () => void // 학기 상태 초기화 함수
}

export const useSemesterStore = create<SemesterState>(set => ({
  semesters: [],
  selectedSemester: null,
  semestersFetched: false, // 초기값은 false
  fetchSemesters: async (branch_id?: number) => {
    // 이미 학기 정보를 가져왔다면 다시 호출하지 않음
    if (useSemesterStore.getState().semestersFetched) {
      return
    }

    try {
      const semesters = await getAllSemesters({ branch_id, limit: 1000 })
      set({ semesters })

      if (semesters.length > 0) {
        let newSelectedSemester: Semester | null = null

        // 1. Priority: In Progress
        newSelectedSemester = semesters.find(s => s.status === SemesterStatus.InProgress) || null

        // 2. Priority: Upcoming (the one that starts soonest)
        if (!newSelectedSemester) {
          const upcomingSemesters = semesters
            .filter(s => s.status === SemesterStatus.Upcoming)
            .sort(
              (a, b) =>
                new Date(a.semester_start_at).getTime() -
                new Date(b.semester_start_at).getTime(),
            )

          if (upcomingSemesters.length > 0) {
            newSelectedSemester = upcomingSemesters[0]
          }
        }

        // 3. Fallback: Most recent semester (by start date)
        if (!newSelectedSemester) {
          const sortedByStartDate = [...semesters].sort(
            (a, b) =>
              new Date(b.semester_start_at).getTime() -
              new Date(a.semester_start_at).getTime(),
          )
          if (sortedByStartDate.length > 0) {
            newSelectedSemester = sortedByStartDate[0]
          }
        }

        set({ selectedSemester: newSelectedSemester })
      } else {
        // 학기가 하나도 없으면 선택된 학기를 null로 설정
        set({ selectedSemester: null })
      }
    } catch (error) {
      console.error('Failed to fetch semesters:', error)
      set({ selectedSemester: null }) // 에러 발생 시 선택된 학기 초기화
    } finally {
      set({ semestersFetched: true }) // API 호출 시도가 끝나면 항상 true로 설정
    }
  },
  setSelectedSemester: (semester: Semester | null) => {
    set({ selectedSemester: semester })
  },
  // 학기 상태를 초기화하는 함수
  resetSemesters: () => {
    set({
      semesters: [],
      selectedSemester: null,
      semestersFetched: false,
    })
  },
}))

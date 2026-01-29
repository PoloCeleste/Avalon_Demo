// src/contexts/PageHeaderContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react' // ReactNode가 import 되어 있는지 확인
import { useSemesterStore } from '../store/semesterStore'
import type { Semester } from '../types/semester'

interface PageHeaderContextType {
  title: ReactNode | undefined // ✨ string -> ReactNode
  setTitle: (title: ReactNode | undefined) => void // ✨ string -> ReactNode
  description: string | undefined
  setDescription: (description: string | undefined) => void
  actions: ReactNode | undefined
  setActions: (actions: ReactNode | undefined) => void
  entityName?: string
  setEntityName?: (name?: string) => void
  selectedSemester: Semester | null
  setSelectedSemester: (semester: Semester | null) => void
  allSemesters: Semester[]
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined)

export const PageHeaderProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState<ReactNode | undefined>(undefined) // ✨ string -> ReactNode
  const [description, setDescription] = useState<string | undefined>(undefined)
  const [actions, setActions] = useState<ReactNode | undefined>(undefined)
  const [entityName, setEntityName] = useState<string | undefined>(undefined)

  const { semesters, fetchSemesters, selectedSemester, setSelectedSemester } = useSemesterStore()

  useEffect(() => {
    if (semesters.length === 0) {
      fetchSemesters()
    }
  }, [semesters, fetchSemesters])

  return (
    <PageHeaderContext.Provider
      value={{
        title,
        setTitle,
        description,
        setDescription,
        actions,
        setActions,
        entityName,
        setEntityName,
        selectedSemester,
        setSelectedSemester,
        allSemesters: semesters,
      }}
    >
      {children}
    </PageHeaderContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePageHeader = () => {
  const context = useContext(PageHeaderContext)
  if (context === undefined) {
    throw new Error('usePageHeader must be used within a PageHeaderProvider')
  }
  return context
}
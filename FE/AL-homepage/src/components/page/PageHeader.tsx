import React, { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import type { Semester } from '../../types/semester'
import { cn } from '../../utils/cn' // cn 함수 import

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: string
  isSemester?: boolean // 학기 브레드크럼인지 식별하기 위한 플래그
}

interface PageHeaderProps {
  title?: React.ReactNode
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  showBreadcrumbs?: boolean
  entityName?: string
  entityType?: 'student' | 'teacher' | 'class' | 'account' | 'other'
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  showBreadcrumbs = true,
  entityName,
  entityType,
}: PageHeaderProps) {
  const location = useLocation()
  const { selectedSemester, allSemesters, setSelectedSemester } = usePageHeader()

  const [isSemesterOpen, setIsSemesterOpen] = useState(false)
  const semesterDropdownRef = useRef<HTMLDivElement>(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        semesterDropdownRef.current &&
        !semesterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSemesterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSemesterSelect = (semester: Semester) => {
    if (setSelectedSemester) {
      setSelectedSemester(semester)
    }
    setIsSemesterOpen(false)
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const crumbs: BreadcrumbItem[] = []

    // 항상 학기 선택을 맨 앞에 추가
    if (allSemesters && allSemesters.length > 0) {
      crumbs.push({
        label: selectedSemester?.semester_name || '학기 선택',
        icon: '🎓',
        isSemester: true,
      })
    } else {
      crumbs.push({
        label: '학기가 없습니다',
        icon: '🎓',
        isSemester: false,
      })
    }

    crumbs.push({ label: '홈', href: '/', icon: '🏠' })

    if (pathSegments.length === 0) {
      return crumbs.concat([{ label: '대시보드', icon: '📊' }])
    }

    if (pathSegments[0] === 'admin' && pathSegments.length > 1) {
      const adminPage = pathSegments[1]
      const adminPageMap: Record<string, { label: string; icon: string }> = {
        calendars: { label: '캘린더 관리', icon: '📅' },
        messages: { label: '메시지 관리', icon: '✉️' },
        curriculums: { label: '커리큘럼 관리', icon: '📘' },
        schedules: { label: '시간표 관리', icon: '📅' },
        accounts: { label: '계정 관리', icon: '👥' },
        branches: { label: '지점 관리', icon: '🏢' },
        semesters: { label: '학기 관리', icon: '🎓' },
        homeworks: { label: '숙제 관리', icon: '📝' },
      }

      const pageInfo = adminPageMap[adminPage] || { label: adminPage, icon: '⚙️' }

      if (pathSegments.length > 2) {
        const detailSegment = pathSegments[2]

        if (adminPage === 'accounts') {
          crumbs.push({
            label: '계정 관리',
            href: '/admin/accounts',
            icon: '👥',
          })

          if (detailSegment === 'new') {
            crumbs.push({
              label: '새 계정 등록',
              icon: '➕',
            })
          } else if (/^\d+$/.test(detailSegment)) {
            crumbs.push({
              label: entityName ? `${entityName}` : `계정 #${detailSegment}`,
              icon: '🔍',
            })
          }
        } else {
          crumbs.push({
            label: pageInfo.label,
            href: `/admin/${adminPage}`,
            icon: pageInfo.icon,
          })

          if (detailSegment === 'new') {
            crumbs.push({
              label: '새 항목',
              icon: '➕',
            })
          } else if (/^\d+$/.test(detailSegment)) {
            crumbs.push({
              label: entityName || `#${detailSegment}`,
              icon: '🔍',
            })
          }
        }
      } else {
        crumbs.push({
          label: pageInfo.label,
          icon: pageInfo.icon,
        })
      }

      return crumbs
    }

    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathSegments.length - 1

      const segmentMap: Record<string, { label: string; icon: string }> = {
        students: { label: '학생 관리', icon: '👥' },
        teachers: { label: '교사 관리', icon: '🧑‍🏫' },
        classes: { label: '반 관리', icon: '📚' },
        'my-page': { label: '마이페이지', icon: '👤' },
        new: { label: '새 항목', icon: '➕' },
        homeworks: { label: '숙제 관리', icon: '📝' },
      }

      const segmentInfo = segmentMap[segment] || { label: segment, icon: '📄' }

      if (/^\d+$/.test(segment) && isLast) {
        if (entityName) {
          let icon = '🔍'
          switch (entityType) {
            case 'student':
              icon = '👤'
              break
            case 'teacher':
              icon = '🧑‍🏫'
              break
            case 'class':
              icon = '📚'
              break
            case 'account':
              icon = '👥'
              break
            default:
              icon = '🔍'
          }
          segmentInfo.label = entityName
          segmentInfo.icon = icon
        } else {
          segmentInfo.label = `#${segment}`
          segmentInfo.icon = '🔍'
        }
      }

      crumbs.push({
        label: segmentInfo.label,
        icon: segmentInfo.icon,
        href: isLast ? undefined : currentPath,
      })
    })

    return crumbs
  }

  const finalBreadcrumbs = breadcrumbs || generateBreadcrumbs()

  const generateTitle = (): string => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    if (pathSegments.length === 0) return '대시보드'

    if (pathSegments[0] === 'admin' && pathSegments.length > 1) {
      const adminPage = pathSegments[1]
      const adminTitleMap: Record<string, string> = {
        calendars: '캘린더 관리',
        messages: '메시지 관리',
        curriculums: '커리큘럼 관리',
        schedules: '시간표 관리',
        accounts: '계정 관리',
        branches: '지점 관리',
        homeworks: '숙제 관리',
      }

      const baseTitle = adminTitleMap[adminPage] || adminPage

      if (pathSegments.length > 2) {
        const detailSegment = pathSegments[2]
        if (detailSegment === 'new') {
          return adminPage === 'accounts' ? '새 계정 등록' : `새 ${baseTitle} 등록`
        } else if (/^\d+$/.test(detailSegment)) {
          if (entityName) {
            return `${entityName} 상세`
          }
          return adminPage === 'accounts' ? `계정 상세` : `${baseTitle} 상세`
        }
      }

      return baseTitle
    }

    const titleMap: Record<string, string> = {
      students: '학생 관리',
      teachers: '교사 관리',
      classes: '반 관리',
      'my-page': '마이페이지',
      homeworks: '숙제 관리',
    }

    const lastSegment = pathSegments[pathSegments.length - 1]

    if (/^\d+$/.test(lastSegment) && pathSegments.length > 1) {
      const parentSegment = pathSegments[pathSegments.length - 2]
      if (entityName) {
        return `${entityName} 상세`
      }
      const parentTitle = titleMap[parentSegment] || '상세 정보'
      return `${parentTitle} 상세`
    }

    if (lastSegment === 'new' && pathSegments.length > 1) {
      const parentSegment = pathSegments[pathSegments.length - 2]
      const parentTitle = titleMap[parentSegment] || '항목'
      return `새 ${parentTitle.replace(' 관리', '')} 등록`
    }

    return titleMap[lastSegment] || titleMap[pathSegments[0]] || '페이지'
  }

  const finalTitle = title || generateTitle()

  const headerBgClass = cn(
    'border border-gray-300 shadow-lg rounded-lg',
    {
      'bg-blue-200': selectedSemester?.status === 0, // 예정 (파랑)
      'bg-gray-50': selectedSemester?.status === 1 || !selectedSemester, // 진행 중 (기존 회색) 또는 선택된 학기 없음
      'bg-green-200': selectedSemester?.status === 2, // 종료 (초록)
    },
    // 텍스트 색상 조정: 모든 상태에서 기본 텍스트 색상 (text-gray-900) 사용
    'text-gray-900',
  )

  return (
    <div className={headerBgClass}>
      <div className="px-6 py-4">
        {showBreadcrumbs && finalBreadcrumbs.length >= 1 && (
          <nav className="flex items-center space-x-2 text-sm mb-3" aria-label="Breadcrumb">
            {finalBreadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-gray-400" aria-hidden="true">
                    /
                  </span>
                )}
                {crumb.isSemester && allSemesters && allSemesters.length > 0 ? (
                  <div className="relative" ref={semesterDropdownRef}>
                    <button
                      onClick={() => setIsSemesterOpen(!isSemesterOpen)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span className="text-xs">{crumb.icon}</span>
                      <span className="hover:underline">{crumb.label}</span>
                      <svg
                        className={`w-4 h-4 transform transition-transform duration-200 ${
                          isSemesterOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </button>
                    {isSemesterOpen && (
                      <div className="absolute top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <ul className="py-1">
                          {allSemesters.map(semester => (
                            <li key={semester.semester_id}>
                              <button
                                onClick={() => handleSemesterSelect(semester)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  selectedSemester?.semester_id === semester.semester_id
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {semester.semester_name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    <span className="text-xs">{crumb.icon}</span>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 text-gray-700 font-medium">
                    <span className="text-xs">{crumb.icon}</span>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{finalTitle}</h1>
            {description && <p className="mt-1 text-sm text-gray-600 max-w-2xl">{description}</p>}
          </div>

          {actions && <div className="ml-6 flex-shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

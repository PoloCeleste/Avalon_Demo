import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  getAllCurriculums,
  uploadCurriculumCsv,
  softDeleteCurriculum,
} from '../../api/curriculum.api.ts'
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../../api/subject.api.ts'
import type { Subject } from '../../types/subject.ts'
import type { Curriculum, CurriculumType } from '../../types/curriculum.ts'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select.tsx'
import { cn } from '../../utils/cn.ts'
import { AxiosError } from 'axios'

// CSV 업로드 API의 에러 응답 타입을 정의합니다.
interface CsvUploadErrorResponse {
  error: {
    message: { errors: string[] } | string
  }
}

// 반복되는 테이블 UI를 위한 별도 컴포넌트
const CurriculumTable = ({
  curriculums,
  onViewDetail,
  onDelete,
  isDeleteMode,
}: {
  curriculums: Curriculum[]
  onViewDetail: (id: number) => void
  onDelete: (curriculum: Curriculum) => void
  isDeleteMode: boolean
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-medium text-gray-700 bg-blue-100">커리큘럼명</th>
          <th className="text-right py-3 px-4 font-medium text-gray-700 bg-blue-100">관리</th>
        </tr>
      </thead>
      <tbody>
        {curriculums.map(c => {
          const isUsed = (c.used_class_count ?? 0) > 0
          return (
            <tr
              key={c.curriculum_id}
              className="border-b border-gray-100 hover:bg-gray-200 even:bg-gray-100"
            >
              <td
                className={cn('py-3 px-4', {
                  'text-gray-400': isDeleteMode && isUsed,
                })}
              >
                {c.curriculum_name}
                {isDeleteMode && isUsed && (
                  <span className="text-xs ml-2">{`(${c.used_class_count}개 반에서 사용중)`}</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                {isDeleteMode ? (
                  <Button variant="destructive" size="sm" onClick={() => onDelete(c)}>
                    삭제
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => onViewDetail(c.curriculum_id)}>
                    상세보기
                  </Button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export default function CurriculumsPage() {
  const navigate = useNavigate()
  const { setTitle, setDescription, setActions } = usePageHeader()

  const [searchQuery, setSearchQuery] = useState('')
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 모드 관리
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  // 모달 관리
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // 데이터 관리
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newCurriculumName, setNewCurriculumName] = useState('')
  const [newCurriculumType, setNewCurriculumType] = useState<CurriculumType>('avalon')
  const [uploading, setUploading] = useState(false)
  const [addError, setAddError] = useState<string[] | null>(null)
  const [isSubjectManagementMode, setIsSubjectManagementMode] = useState(false)
  const [showSubjectManagementButton, setShowSubjectManagementButton] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false)
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false)
  const [newSubjectData, setNewSubjectData] = useState({ subject_name: '', subject_nick: '' })
  const [isCreatingSubject, setIsCreatingSubject] = useState(false)
  const [isSubjectEditMode, setIsSubjectEditMode] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)
  const [isDeleteSubjectModalOpen, setIsDeleteSubjectModalOpen] = useState(false)
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetAddModalState = () => {
    setSelectedFile(null)
    setNewCurriculumName('')
    setNewCurriculumType('avalon')
    setAddError(null)
    setIsSubjectManagementMode(false)
    setShowSubjectManagementButton(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const loadCurriculums = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllCurriculums()
      setCurriculums(data)
    } catch (err) {
      setError('커리큘럼 목록을 불러오지 못했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsSubjectsLoading(true)
      try {
        const data = await getAllSubjects()
        setSubjects(data)
      } catch (error) {
        console.error('Failed to fetch subjects:', error)
        // Optionally, set an error state here to show in the UI
      } finally {
        setIsSubjectsLoading(false)
      }
    }

    if (isSubjectManagementMode && subjects.length === 0) {
      fetchSubjects()
    }
  }, [isSubjectManagementMode, subjects.length])

  useEffect(() => {
    loadCurriculums()
  }, [])

  useEffect(() => {
    setTitle('커리큘럼 관리')
    setDescription('학원의 커리큘럼 목록을 조회하고 검색할 수 있습니다')

    setActions(
      <div className="flex space-x-2">
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" disabled={uploading}>
          {uploading ? '업로드 중...' : '새 커리큘럼 추가'}
        </Button>
        <Button
          onClick={() => setIsDeleteMode(prev => !prev)}
          size="sm"
          variant={isDeleteMode ? 'outline' : 'destructive'}
        >
          {isDeleteMode ? '확인' : '삭제'}
        </Button>
      </div>,
    )
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
    }
  }, [setTitle, setDescription, setActions, isDeleteMode, uploading])

  const groupedCurriculums = useMemo(() => {
    const filtered = curriculums.filter(c =>
      c.curriculum_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return filtered.reduce(
      (acc, curriculum) => {
        const { type } = curriculum
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(curriculum)
        return acc
      },
      {} as Record<CurriculumType, Curriculum[]>,
    )
  }, [curriculums, searchQuery])

  const curriculumTypeLabels: Record<CurriculumType, string> = {
    avalon: '아발론 (Avalon)',
    langcon: '랭콘 (Langcon)',
    vacation: '방학 (Vacation)',
    special: '특강 (Special)',
  }

  const handleViewDetail = (id: number) => {
    navigate(`/admin/curriculums/${id}`)
  }

  const handleDeleteClick = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedCurriculum) {
      try {
        await softDeleteCurriculum(selectedCurriculum.curriculum_id)
        alert(`'${selectedCurriculum.curriculum_name}' 커리큘럼이 삭제되었습니다.`)
        loadCurriculums() // 목록 새로고침
      } catch (err) {
        alert('삭제에 실패했습니다.')
        console.error(err)
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedCurriculum(null)
  }

  const handleSubjectManagementToggle = () => {
    if (!isSubjectManagementMode) {
      alert('과목 목록을 확인 할 수 있습니다. csv내의 과목명을 수정하거나 과목을 추가해주세요')
    }
    setIsSubjectManagementMode(prev => !prev)
  }

  const closeAddSubjectModal = () => {
    setIsAddSubjectModalOpen(false)
    setNewSubjectData({ subject_name: '', subject_nick: '' })
    setSubjectToEdit(null)
  }

  const handleEditSubjectClick = (subject: Subject) => {
    setSubjectToEdit(subject)
    setNewSubjectData({
      subject_name: subject.subject_name,
      subject_nick: subject.subject_nick,
    })
    setIsAddSubjectModalOpen(true)
  }

  const handleConfirmUpdateSubject = async () => {
    if (!subjectToEdit) return

    const name = newSubjectData.subject_name.trim()
    const nick = newSubjectData.subject_nick.trim()

    if (!name || !nick) {
      alert('과목 이름과 닉네임을 모두 입력해주세요.')
      return
    }

    // 다른 과목과 중복되는지 체크
    if (
      subjects.some(
        s =>
          s.subject_id !== subjectToEdit.subject_id && (s.subject_name === name || s.subject_nick === nick),
      )
    ) {
      alert('이미 존재하는 과목 이름 또는 닉네임입니다.')
      return
    }

    setIsCreatingSubject(true)
    try {
      const updatedSubject = await updateSubject(subjectToEdit.subject_id, {
        subject_name: name,
        subject_nick: nick,
      })
      setSubjects(prev =>
        prev.map(s => (s.subject_id === subjectToEdit.subject_id ? updatedSubject : s)),
      )
      alert('과목 정보가 수정되었습니다.')
      closeAddSubjectModal()
    } catch (error) {
      console.error('Failed to update subject:', error)
      alert('과목 수정에 실패했습니다.')
    } finally {
      setIsCreatingSubject(false)
    }
  }

  const handleNewSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSubjectData(prev => ({ ...prev, [name]: value }))
  }

  const handleConfirmCreateSubject = async () => {
    if (!newSubjectData.subject_name || !newSubjectData.subject_nick) {
      alert('과목 이름과 닉네임을 모두 입력해주세요.')
      return
    }
    setIsCreatingSubject(true)
    try {
      await createSubject(newSubjectData)
      closeAddSubjectModal()
      // Fetch the updated list of subjects
      const updatedSubjects = await getAllSubjects()
      setSubjects(updatedSubjects)
      alert('새로운 과목이 추가되었습니다.')
    } catch (error) {
      console.error('Failed to create subject:', error)
      alert('과목 추가에 실패했습니다.')
    } finally {
      setIsCreatingSubject(false)
    }
  }

  const handleDeleteSubjectClick = (subject: Subject) => {
    setSubjectToDelete(subject)
    setIsDeleteSubjectModalOpen(true)
  }

  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return

    try {
      await deleteSubject(subjectToDelete.subject_id)
      setSubjects(prev => prev.filter(s => s.subject_id !== subjectToDelete.subject_id))
      alert('과목이 삭제되었습니다.')
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        alert('사용중인 과목은 삭제가 불가능합니다.')
      } else {
        alert('삭제에 실패했습니다.')
        console.error(err)
      }
    } finally {
      setIsDeleteSubjectModalOpen(false)
      setSubjectToDelete(null)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  useEffect(() => {
    if (
      addError &&
      addError.some(
        e =>
          (e.includes('Subject') && e.includes('not found')) ||
          (e.includes('과목') && e.includes('데이터베이스에 없습니다')),
      )
    ) {
      setShowSubjectManagementButton(true)
    } else {
      setShowSubjectManagementButton(false)
    }
  }, [addError])

  const handleAddCurriculum = async () => {
    setAddError(null)
    if (!selectedFile) {
      setAddError(['CSV 파일을 선택해주세요.'])
      return
    }

    setUploading(true)
    try {
      await uploadCurriculumCsv(
        selectedFile,
        newCurriculumType,
        newCurriculumName.trim() || undefined,
      )
      loadCurriculums()
      setIsAddModalOpen(false)
      resetAddModalState()
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const errorData = err.response.data as CsvUploadErrorResponse
        const message = errorData?.error?.message
        if (typeof message === 'string') {
          setAddError([message])
        } else if (Array.isArray(message?.errors) && message.errors.length > 0) {
          setAddError(message.errors)
        } else {
          setAddError(['업로드 실패: 알 수 없는 오류가 발생했습니다.'])
        }
      } else {
        setAddError(['파일 업로드 중 오류가 발생했습니다.'])
      }
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loading />
      </div>
    )
  }

  if (error) {
    return <div className="text-center p-6 text-red-600">{error}</div>
  }

  const isUsed = (selectedCurriculum?.used_class_count ?? 0) > 0

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: 'none' }}
      />
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="커리큘럼명으로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(curriculumTypeLabels) as CurriculumType[]).map(type => {
          const list = groupedCurriculums[type] || []
          return (
            <Card key={type}>
              <CardHeader
                title={curriculumTypeLabels[type]}
                subtitle={`총 ${list.length}개의 커리큘럼`}
              />
              <CardContent>
                {list.length > 0 ? (
                  <CurriculumTable
                    curriculums={list}
                    onViewDetail={handleViewDetail}
                    onDelete={handleDeleteClick}
                    isDeleteMode={isDeleteMode}
                  />
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 커리큘럼이 없습니다.'}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`'${selectedCurriculum?.curriculum_name}' 커리큘큘럼 삭제`}
        footer={
          <>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              확인
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              취소
            </Button>
          </>
        }
      >
        <div className="text-center">
          {isUsed && (
            <div className="mb-2">
              {`${selectedCurriculum?.used_class_count}개의 반에서 사용중입니다.`}
            </div>
          )}
          <div className="mb-4">정말 삭제하시겠습니까?</div>
          <strong className="text-red-600">삭제 이후에는 수정하거나 되돌릴 수 없습니다.</strong>
        </div>
      </Modal>

      {/* 새 커리큘럼 추가 모달 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          resetAddModalState()
        }}
        title="새 커리큘럼 추가"
        className={isSubjectManagementMode ? 'max-w-4xl' : 'max-w-xl'}
        footer={
          <div className="flex justify-between w-full items-center">
            <div>
              {showSubjectManagementButton && (
                <Button variant="outline" onClick={handleSubjectManagementToggle}>
                  {isSubjectManagementMode ? '입력으로 돌아가기' : '과목 관리'}
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  resetAddModalState()
                }}
              >
                취소
              </Button>
              <Button onClick={handleAddCurriculum} disabled={uploading}>
                {uploading ? '추가 중...' : '추가'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex">
          {isSubjectManagementMode && (
            <div className="w-1/2 border-r pr-6 flex flex-col">
              <h4 className="font-semibold text-lg mb-2">과목 관리</h4>
              {isSubjectsLoading ? (
                <div className="flex justify-center items-center flex-grow">
                  <Loading />
                </div>
              ) : (
                <div className="flex flex-col flex-grow">
                  <div className="flex-grow bg-gray-50 p-2 rounded-md max-h-80 overflow-y-auto">
                    <ul className="space-y-1 text-sm text-gray-800">
                      {subjects.map(subject => (
                        <li
                          key={subject.subject_id}
                          className="p-2 rounded hover:bg-gray-200 flex justify-between items-center"
                        >
                          <span>{subject.subject_name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                              {subject.subject_nick}
                            </span>
                            {isSubjectEditMode && (
                              <>
                                <button
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={() => handleEditSubjectClick(subject)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  className="text-gray-400 hover:text-red-600"
                                  onClick={() => handleDeleteSubjectClick(subject)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubjectToEdit(null)
                        setNewSubjectData({ subject_name: '', subject_nick: '' })
                        setIsAddSubjectModalOpen(true)
                      }}
                    >
                      과목 추가
                    </Button>
                    <Button size="sm" onClick={() => setIsSubjectEditMode(prev => !prev)}>
                      {isSubjectEditMode ? '완료' : '수정 / 삭제'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={cn('space-y-4', isSubjectManagementMode ? 'w-1/2 pl-6' : 'w-full')}>
            <Input
              label="커리큘럼 이름"
              value={newCurriculumName}
              onChange={e => setNewCurriculumName(e.target.value)}
              placeholder="입력하지 않으면 파일명으로 저장합니다"
            />
            <Select
              label="구분"
              options={[
                { value: 'avalon', label: 'Avalon' },
                { value: 'langcon', label: 'Langcon' },
                { value: 'vacation', label: 'Vacation' },
                { value: 'special', label: 'Special' },
              ]}
              value={newCurriculumType}
              onChange={e => setNewCurriculumType(e.target.value as CurriculumType)}
            />
            <div>
              <div className="text-xs text-gray-500 mb-1">CSV 파일</div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0"
                >
                  파일 선택
                </Button>
                <div className="flex-grow text-sm text-gray-600 truncate">
                  {selectedFile ? selectedFile.name : '선택된 파일 없음'}
                </div>
              </div>
            </div>
            <div
              className={cn(
                'text-sm text-red-600 bg-red-100 rounded-md transition-all duration-300 ease-in-out overflow-hidden',
                addError && addError.length > 0
                  ? 'max-h-40 p-3 mt-2 overflow-y-auto'
                  : 'max-h-0 p-0 mt-0 opacity-0',
              )}
            >
              <ul className="list-disc list-inside space-y-1">
                {addError?.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Modal>

      {/* 새 과목 추가 / 수정 모달 */}
      <Modal
        isOpen={isAddSubjectModalOpen}
        onClose={closeAddSubjectModal}
        title={subjectToEdit ? '과목 수정' : '새 과목 추가'}
        footer={
          <>
            <Button variant="outline" onClick={closeAddSubjectModal}>
              취소
            </Button>
            <Button
              onClick={subjectToEdit ? handleConfirmUpdateSubject : handleConfirmCreateSubject}
              disabled={isCreatingSubject}
            >
              {isCreatingSubject
                ? subjectToEdit
                  ? '수정 중...'
                  : '추가 중...'
                : subjectToEdit
                  ? '수정'
                  : '확인'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="과목 이름"
            name="subject_name"
            value={newSubjectData.subject_name}
            onChange={handleNewSubjectChange}
            placeholder="예: READING"
          />
          <Input
            label="과목 닉네임"
            name="subject_nick"
            value={newSubjectData.subject_nick}
            onChange={handleNewSubjectChange}
            placeholder="예: R"
          />
        </div>
      </Modal>

      {/* 과목 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteSubjectModalOpen}
        onClose={() => setIsDeleteSubjectModalOpen(false)}
        title={`'${subjectToDelete?.subject_name}' 과목 삭제`}
        footer={
          <>
            <Button variant="destructive" onClick={handleConfirmDeleteSubject}>
              확인
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteSubjectModalOpen(false)}>
              취소
            </Button>
          </>
        }
      >
        <div className="text-center">
          <div className="mb-4">정말 삭제하시겠습니까?</div>
          <strong className="text-red-600">
            삭제는 사용하지 않는 과목만 가능하며, 삭제 시 되돌릴 수 없습니다.
          </strong>
        </div>
      </Modal>
    </div>
  )
}

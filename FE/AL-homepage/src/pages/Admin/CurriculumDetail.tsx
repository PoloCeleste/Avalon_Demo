import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageHeader } from '../../contexts/PageHeaderContext'
import { getAllCurriculumDetails, updateCurriculumDetail } from '../../api/curriculumDetail.api'
import { getAllSubjects } from '../../api/subject.api'
// ✨ updateHomework, createHomework, deleteHomework import 추가
import {
  getAllHomeworks,
  updateHomework,
  createHomework,
  deleteHomework,
} from '../../api/homework.api'
import { createTodo, getAllTodos, updateTodo, deleteTodo } from '../../api/todo.api'
import Loading from '../../components/ui/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import StyledTabs from '../../components/ui/StyledTabs'
import Modal from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'
import { Input } from '../../components/ui/Input' // ✨ Input import 추가
import { Label } from '../../components/ui/Label' // ✨ Label import 추가
import type { Curriculum } from '../../types/curriculum'
import { getCurriculumById, updateCurriculum } from '../../api/curriculum.api'
import type { CurriculumDetail as CurriculumDetailType } from '../../types/curriculumDetail'
import type { Subject } from '../../types/subject'
// ✨ CreateHomeworkRequest, UpdateHomeworkRequest 타입 import 추가
import type { Homework, CreateHomeworkRequest, UpdateHomeworkRequest } from '../../types/homework'
import type { Todo, CreateTodoRequest } from '../../types/todo'
import { cn } from '../../utils/cn'
import { Pencil } from 'lucide-react'

const CurriculumDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setTitle, setDescription, setActions, setEntityName } = usePageHeader()
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [curriculumDetails, setCurriculumDetails] = useState<CurriculumDetailType[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const todoTypes = ['NOTICE', 'BEFORE', 'IN']

  // 일반 텍스트 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    detail: CurriculumDetailType
    fieldName: string
  } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // ✨ 1. 숙제 수정 모달 전용 상태 추가
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false)
  const [editingCellDetail, setEditingCellDetail] = useState<CurriculumDetailType | null>(null)
  const [editingHomeworks, setEditingHomeworks] = useState<Homework[]>([])
  const [newHomework, setNewHomework] = useState<
    Omit<CreateHomeworkRequest, 'curri_detail_id' | 'subject_id'>
  >({
    homework_name: '',
    homework_contents: '',
    tag_name: '',
    is_online: false,
  })

  // ✨ 2. handleCellClick 핸들러 수정: '숙제' 클릭 시 숙제 모달 열기
  const handleCellClick = useCallback(
    (detail: CurriculumDetailType, fieldName: string) => {
      if (!editMode) return

      if (fieldName === '숙제') {
        setEditingCellDetail(detail)
        // detail.homeworks가 undefined일 수 있으므로 || [] 추가
        setEditingHomeworks(detail.homeworks || [])
        setIsHomeworkModalOpen(true)
      } else {
        setEditingCell({ detail, fieldName })
        let initialValue = ''
        if (fieldName === '진도') {
          initialValue = detail.progress
        } else {
          initialValue =
            detail.todos
              ?.filter(todo => todo.todo_type === fieldName)
              .map(todo => todo.todo_thing)
              .join('\n') || ''
        }
        setEditValue(initialValue)
        setIsEditModalOpen(true)
      }
    },
    [editMode],
  )

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setEditingCell(null)
    setEditValue('')
  }

  const handleSaveChangesFromModal = async () => {
    if (!editingCell || isSaving) return

    const { detail, fieldName } = editingCell
    setIsSaving(true)
    try {
      if (fieldName === '진도') {
        // '진도' 필드 업데이트
        await updateCurriculumDetail(detail.curri_detail_id, { progress: editValue })
      } else {
        // 'NOTICE', 'BEFORE', 'IN' (Todo) 필드 업데이트
        // 백엔드 제약 조건: (curri_detail_id, subject_id, todo_type) 당 하나의 todo만 허용.
        // 따라서 여러 줄의 텍스트는 하나의 todo_thing에 저장되어야 함.

        const existingTodo = detail.todos?.find(t => t.todo_type === fieldName)

        if (existingTodo) {
          // 기존 Todo가 있으면 내용이 비었더라도 빈 문자열로 업데이트 (삭제하지 않음)
          await updateTodo(existingTodo.todo_id, { todo_thing: editValue })
        } else if (editValue.trim() !== '') {
          // 기존 Todo가 없고, 입력값이 있으면 새로 생성
          const payload: CreateTodoRequest = {
            curri_detail_id: detail.curri_detail_id,
            subject_id: detail.subject_id,
            todo_type: fieldName as 'NOTICE' | 'BEFORE' | 'IN',
            todo_thing: editValue,
          }
          await createTodo(payload)
        }
        // 기존 Todo도 없고, 입력값도 없으면 아무것도 하지 않음.
      }

      alert('성공적으로 저장되었습니다.')
      await fetchCurriculumData() // 데이터 새로고침
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save changes:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTodo = async () => {
    if (!editingCell) return

    const { detail, fieldName } = editingCell
    const existingTodo = detail.todos?.find(t => t.todo_type === fieldName)

    if (!existingTodo) {
      // 삭제할 Todo가 없으면 그냥 모달을 닫습니다.
      handleCloseModal()
      return
    }

    if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      setIsSaving(true)
      try {
        await deleteTodo(existingTodo.todo_id)
        alert('성공적으로 삭제되었습니다.')
        await fetchCurriculumData() // 데이터 새로고침
        handleCloseModal()
      } catch (error) {
        console.error('Failed to delete todo:', error)
        alert('삭제에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    }
  }

  // ✨ 3. 숙제 모달 관련 핸들러 함수 추가
  const closeHomeworkModal = () => {
    setIsHomeworkModalOpen(false)
    setEditingCellDetail(null)
    setEditingHomeworks([])
    setNewHomework({ homework_name: '', homework_contents: '', tag_name: '', is_online: false })
  }

  const handleHomeworkChange = (index: number, field: keyof Homework, value: string | boolean) => {
    const updatedHomeworks = [...editingHomeworks]
    const homeworkToUpdate = { ...updatedHomeworks[index] }

    if (typeof value === 'boolean' && field === 'is_online') {
      homeworkToUpdate[field] = value
    } else if (typeof value === 'string') {
      ;(homeworkToUpdate[field as keyof Omit<Homework, 'is_online'>] as string) = value
    }

    updatedHomeworks[index] = homeworkToUpdate
    setEditingHomeworks(updatedHomeworks)
  }

  const handleUpdateHomework = async (index: number) => {
    const homework = editingHomeworks[index]
    const payload: UpdateHomeworkRequest = {
      homework_name: homework.homework_name,
      homework_contents: homework.homework_contents,
      tag_name: homework.tag_name,
      is_online: homework.is_online,
    }
    try {
      await updateHomework(homework.homework_id, payload)
      alert('숙제가 성공적으로 수정되었습니다.')
      fetchCurriculumData() // 데이터 새로고침
    } catch (err) {
      alert('숙제 수정에 실패했습니다.')
      console.error(err)
    }
  }

  const handleCreateHomework = async () => {
    if (!editingCellDetail || !newHomework.homework_name) {
      alert('숙제 이름을 입력해주세요.')
      return
    }
    const payload: CreateHomeworkRequest = {
      ...newHomework,
      curri_detail_id: editingCellDetail.curri_detail_id,
      subject_id: editingCellDetail.subject_id,
    }
    try {
      await createHomework(payload)
      alert('새로운 숙제가 추가되었습니다.')
      fetchCurriculumData() // 데이터 새로고침
      closeHomeworkModal() // 성공 시 모달 닫기
    } catch (err) {
      alert('숙제 추가에 실패했습니다.')
      console.error(err)
    }
  }

  const handleDeleteHomework = async (homeworkId: number) => {
    if (!window.confirm('정말로 이 숙제를 삭제하시겠습니까?')) {
      return
    }
    try {
      await deleteHomework(homeworkId)
      alert('숙제가 성공적으로 삭제되었습니다.')
      fetchCurriculumData() // 데이터 새로고침
      closeHomeworkModal() // 성공 시 모달 닫기
    } catch (err) {
      alert('숙제 삭제에 실패했습니다.')
      console.error(err)
    }
  }

  const startEdit = useCallback(() => {
    if (curriculum) {
      setEditingTitle(curriculum.curriculum_name)
      setEditMode(true)
    }
  }, [curriculum])

  const cancelEdit = useCallback(() => {
    setEditMode(false)
  }, [])

  const saveChanges = useCallback(async () => {
    const newTitle = titleInputRef.current?.value
    if (!curriculum || !newTitle || curriculum.curriculum_name === newTitle) {
      setEditMode(false)
      return
    }
    try {
      const updatedCurriculum = await updateCurriculum(curriculum.curriculum_id, newTitle)
      setCurriculum(updatedCurriculum) // 상태 업데이트
      alert('커리큘럼 이름이 성공적으로 수정되었습니다.')
      setEditMode(false)
    } catch (err) {
      alert('이름 수정에 실패했습니다.')
      console.error(err)
    }
  }, [curriculum])

  useEffect(() => {
    if (curriculum) {
      // ✨ 4. editMode에 따라 제목을 다르게 설정
      if (editMode) {
        setTitle(
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-gray-500" />
            <Input
              ref={titleInputRef}
              defaultValue={editingTitle}
              className="text-2xl font-bold p-0 border-0 shadow-none focus-visible:ring-0"
            />
          </div>,
        )
      } else {
        setTitle(curriculum.curriculum_name)
      }

      setDescription('커리큘럼 상세 정보를 확인하고 수정할 수 있습니다.')

      // ✨ 5. editMode에 따라 버튼을 다르게 설정
      setActions(
        <div className="flex space-x-2">
          <Button onClick={() => navigate(-1)} size="sm" variant="outline">
            목록으로
          </Button>
          {!editMode ? (
            <Button onClick={startEdit} size="sm" variant="primary">
              수정
            </Button>
          ) : (
            <>
              <Button onClick={cancelEdit} size="sm" variant="subtle">
                취소
              </Button>
              <Button onClick={saveChanges} size="sm" variant="primary">
                확인
              </Button>
            </>
          )}
        </div>,
      )
      if (setEntityName) setEntityName(curriculum.curriculum_name)
    }
    return () => {
      setTitle(undefined)
      setDescription(undefined)
      setActions(undefined)
      if (setEntityName) setEntityName(undefined)
    }
  }, [
    curriculum,
    navigate,
    setTitle,
    setDescription,
    setActions,
    setEntityName,
    editMode,
    editingTitle,
    startEdit,
    cancelEdit,
    saveChanges,
  ])

  const fetchCurriculumData = useCallback(async () => {
    if (!id) {
      setError('Curriculum ID is not provided.')
      setLoading(false)
      return
    }
    try {
      const [curriculumData, detailsData, subjectsData] = await Promise.all([
        getCurriculumById(Number(id)),
        getAllCurriculumDetails({ curriculum_id: Number(id), limit: 1000 }),
        getAllSubjects({ limit: 1000 }),
      ])
      setCurriculum(curriculumData)

      const detailsWithRelations = detailsData.sort((a, b) => a.day - b.day)

      setCurriculumDetails(detailsWithRelations)

      setSubjects(subjectsData)
      const uniqueSubjectIds = new Set<number>()
      detailsData.forEach(detail => {
        uniqueSubjectIds.add(detail.subject_id)
      })
      const homeworkPromises: Promise<Homework[]>[] = []
      const todoPromises: Promise<Todo[]>[] = []
      for (const subjectId of Array.from(uniqueSubjectIds)) {
        homeworkPromises.push(
          getAllHomeworks({ subject_id: subjectId, curriculum_id: Number(id), limit: 1000 }),
        )
        todoPromises.push(
          getAllTodos({ subject_id: subjectId, curriculum_id: Number(id), limit: 1000 }),
        )
      }
      const allHomeworksBySubject = await Promise.all(homeworkPromises)
      const allTodosBySubject = await Promise.all(todoPromises)
      const homeworksData = allHomeworksBySubject.flat()
      const todosData = allTodosBySubject.flat()
      setHomeworks(homeworksData)
      setTodos(todosData)
      if (detailsData.length > 0) {
        setSelectedSubjectId(detailsData[0].subject_id)
      } else if (subjectsData.length > 0) {
        setSelectedSubjectId(subjectsData[0].subject_id)
      }
    } catch (err) {
      setError('Failed to fetch curriculum details, subjects, homeworks, or todos.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCurriculumData()
  }, [fetchCurriculumData])

  const groupedDetails = useMemo(() => {
    const groups: Record<
      number,
      (CurriculumDetailType & { homeworks: Homework[]; todos: Todo[] })[]
    > = {}
    curriculumDetails.forEach(detail => {
      if (!groups[detail.subject_id]) {
        groups[detail.subject_id] = []
      }
      const detailHomeworks = homeworks.filter(
        hw => hw.curri_detail_id === detail.curri_detail_id && hw.subject_id === detail.subject_id,
      )
      const detailTodos = todos.filter(
        todo =>
          todo.curri_detail_id === detail.curri_detail_id && todo.subject_id === detail.subject_id,
      )
      groups[detail.subject_id].push({ ...detail, homeworks: detailHomeworks, todos: detailTodos })
    })
    for (const subjectId in groups) {
      groups[subjectId].sort((a, b) => a.day - b.day)
    }
    return groups
  }, [curriculumDetails, homeworks, todos])

  const getSubjectName = (subjectId: number) => {
    return subjects.find(s => s.subject_id === subjectId)?.subject_name || `과목 #${subjectId}`
  }

  if (loading) return <Loading />
  if (error) return <div className="text-red-500">{error}</div>
  if (!curriculum) return <div>커리큘럼 데이터를 찾을 수 없습니다.</div>

  const uniqueSubjectIds = Object.keys(groupedDetails)
    .map(Number)
    .sort((a, b) => a - b)

  const subjectTabs = uniqueSubjectIds.map(subjectId => ({
    id: String(subjectId),
    label: getSubjectName(subjectId),
    content: (
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-100"
              >
                Day
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-100 max-w-md"
              >
                진도
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-100"
              >
                숙제
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-100"
              >
                NOTICE
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-100"
              >
                BEFORE
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-100"
              >
                IN
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedDetails[subjectId].map(detail => (
              <tr
                key={detail.curri_detail_id}
                className="border-b border-gray-100 hover:bg-gray-200 even:bg-gray-100"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {detail.day}
                </td>
                <td
                  className={cn(
                    'px-6 py-4 whitespace-pre-wrap break-words text-sm text-gray-500 max-w-md',
                    editMode && 'cursor-pointer hover:bg-yellow-100 transition-colors',
                  )}
                  onClick={() => handleCellClick(detail, '진도')}
                >
                  {detail.progress}
                </td>
                <td
                  className={cn(
                    'px-6 py-4 whitespace-pre-wrap break-words text-sm text-gray-500 max-w-md',
                    editMode && 'cursor-pointer hover:bg-yellow-100 transition-colors',
                  )}
                  onClick={() => handleCellClick(detail, '숙제')}
                >
                  {(detail.homeworks || []).length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {detail.homeworks?.map(hw => (
                        <li key={hw.homework_id}>
                          <span className="font-medium">{hw.homework_name}</span> ({hw.tag_name})
                          {hw.homework_contents && (
                            <h3 className="text-xs text-gray-600 pl-3 mt-1">
                              {hw.homework_contents}
                            </h3>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '없음'
                  )}
                </td>
                {todoTypes.map(todoType => (
                  <td
                    key={todoType}
                    className={cn(
                      'px-6 py-4 text-sm text-gray-500 align-middle max-w-sm whitespace-pre-wrap break-words',
                      editMode && 'cursor-pointer hover:bg-yellow-100 transition-colors',
                    )}
                    onClick={() => handleCellClick(detail, todoType)}
                  >
                    {(detail.todos?.filter(todo => todo.todo_type === todoType) || []).length >
                    0 ? (
                      <ul className="list-inside">
                        {detail.todos
                          ?.filter(todo => todo.todo_type === todoType)
                          .map((todo, index) => (
                            <li key={index} className="py-2">
                              {todo.todo_thing}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">없음</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  }))

  return (
    <div className="space-y-6">
      <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle>커리큘럼 상세</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode && (
            <div className="p-3 mb-4 text-center bg-blue-100 border border-blue-300 text-blue-800 rounded-md text-sm font-semibold animate-pulse">
              수정 모드 입니다. 테이블의 각 칸을 눌러서 수정할 수 있습니다.
            </div>
          )}
          {uniqueSubjectIds.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              이 커리큘럼에 대한 상세 정보가 없습니다.
            </div>
          ) : (
            <StyledTabs
              tabs={subjectTabs}
              defaultTabId={selectedSubjectId ? String(selectedSubjectId) : undefined}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title={
          editingCell ? `Day ${editingCell.detail.day} - ${editingCell.fieldName} 수정` : '수정'
        }
        footer={
          <div className="flex justify-between w-full">
            <Button variant="destructive" onClick={handleDeleteTodo} disabled={isSaving}>
              삭제
            </Button>
            <div className="flex space-x-2">
              <Button variant="subtle" onClick={handleCloseModal}>
                취소
              </Button>
              <Button variant="primary" onClick={handleSaveChangesFromModal} disabled={isSaving}>
                저장
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          <label
            htmlFor="edit-textarea"
            className="text-sm font-medium text-gray-700"
          >{`새로운 ${editingCell?.fieldName} 내용을 입력하세요.`}</label>
          <Textarea
            id="edit-textarea"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            rows={3}
            placeholder="내용을 입력..."
          />
        </div>
      </Modal>

      {/* ✨ 4. 숙제 수정 모달 JSX 추가 */}
      <Modal
        isOpen={isHomeworkModalOpen}
        onClose={closeHomeworkModal}
        title={`Day ${editingCellDetail?.day} 숙제 관리`}
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-4">
            <h4 className="font-semibold">등록된 숙제</h4>
            {editingHomeworks.length > 0 ? (
              editingHomeworks.map((hw, index) => (
                <div key={hw.homework_id} className="p-4 border rounded-md space-y-3">
                  {/* ✨ 레이아웃 수정: 숙제 이름 */}
                  <div>
                    <Label htmlFor={`hw-name-${hw.homework_id}`}>숙제 이름</Label>
                    <Input
                      id={`hw-name-${hw.homework_id}`}
                      value={hw.homework_name}
                      onChange={e => handleHomeworkChange(index, 'homework_name', e.target.value)}
                    />
                  </div>
                  {/* ✨ 레이아웃 수정: 태그와 온라인 여부를 한 줄로 묶음 */}
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <Label htmlFor={`hw-tag-${hw.homework_id}`}>태그</Label>
                      <Input
                        id={`hw-tag-${hw.homework_id}`}
                        value={hw.tag_name}
                        onChange={e => handleHomeworkChange(index, 'tag_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>숙제 구분</Label>
                      <div className="mt-1 flex rounded-md border border-gray-300 p-0.5 w-full">
                        <button
                          type="button"
                          onClick={() => handleHomeworkChange(index, 'is_online', true)}
                          className={cn(
                            'flex-1 rounded-sm px-3 py-1 text-sm font-medium transition-colors',
                            hw.is_online
                              ? 'bg-blue-600 text-white'
                              : 'bg-transparent text-gray-600 hover:bg-gray-100',
                          )}
                        >
                          Online
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHomeworkChange(index, 'is_online', false)}
                          className={cn(
                            'flex-1 rounded-sm px-3 py-1 text-sm font-medium transition-colors',
                            !hw.is_online
                              ? 'bg-blue-600 text-white'
                              : 'bg-transparent text-gray-600 hover:bg-gray-100',
                          )}
                        >
                          Offline
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* ✨ 레이아웃 수정: 숙제 내용 */}
                  <div>
                    <Label htmlFor={`hw-contents-${hw.homework_id}`}>숙제 내용</Label>
                    <Textarea
                      id={`hw-contents-${hw.homework_id}`}
                      value={hw.homework_contents}
                      onChange={e =>
                        handleHomeworkChange(index, 'homework_contents', e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteHomework(hw.homework_id)}
                      disabled={isSaving}
                    >
                      삭제
                    </Button>
                    <Button size="sm" onClick={() => handleUpdateHomework(index)} disabled={isSaving}>
                      수정사항 저장
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">등록된 숙제가 없습니다.</p>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h4 className="font-semibold">새 숙제 추가</h4>
            <div className="p-4 border rounded-md space-y-3 bg-gray-50">
              {/* ✨ 레이아웃 수정: 숙제 이름 */}
              <div>
                <Label htmlFor="new-hw-name">숙제 이름</Label>
                <Input
                  id="new-hw-name"
                  value={newHomework.homework_name}
                  onChange={e => setNewHomework({ ...newHomework, homework_name: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              {/* ✨ 레이아웃 수정: 태그와 온라인 여부를 한 줄로 묶음 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-hw-tag">태그</Label>
                  <Input
                    id="new-hw-tag"
                    value={newHomework.tag_name}
                    onChange={e => setNewHomework({ ...newHomework, tag_name: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label>숙제 구분</Label>
                  <div className="mt-1 flex rounded-md border border-gray-300 p-0.5 w-full">
                    <button
                      type="button"
                      onClick={() => setNewHomework({ ...newHomework, is_online: true })}
                      className={cn(
                        'flex-1 rounded-sm px-3 py-1 text-sm font-medium transition-colors',
                        newHomework.is_online
                          ? 'bg-blue-600 text-white'
                          : 'bg-transparent text-gray-600 hover:bg-gray-100',
                      )}
                      disabled={isSaving}
                    >
                      Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewHomework({ ...newHomework, is_online: false })}
                      className={cn(
                        'flex-1 rounded-sm px-3 py-1 text-sm font-medium transition-colors',
                        !newHomework.is_online
                          ? 'bg-blue-600 text-white'
                          : 'bg-transparent text-gray-600 hover:bg-gray-100',
                      )}
                      disabled={isSaving}
                    >
                      Offline
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="new-hw-contents">숙제 내용</Label>
                <Textarea
                  id="new-hw-contents"
                  value={newHomework.homework_contents}
                  onChange={e =>
                    setNewHomework({ ...newHomework, homework_contents: e.target.value })
                  }
                  rows={2}
                  disabled={isSaving}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleCreateHomework}
                  disabled={isSaving}
                >
                  {isSaving ? '추가 중...' : '새 숙제 추가하기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CurriculumDetail

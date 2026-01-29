export type TodoType = 'NOTICE' | 'BEFORE' | 'IN'

export interface Todo {
  curri_detail_id: number
  subject_id: number
  todo_type: TodoType
  todo_thing: string
  todo_id: number
}

export interface CreateTodoRequest {
  curri_detail_id: number
  subject_id: number
  todo_type: TodoType
  todo_thing: string
}

export interface UpdateTodoRequest {
  todo_thing: string
}

export interface GetAllTodosParams {
  skip?: number
  limit?: number
  curriculum_id?: number
  curri_detail_id?: number
  subject_id?: number
  todo_type?: TodoType
}

import instance from './axiosInstance'
import type { Todo, CreateTodoRequest, UpdateTodoRequest, GetAllTodosParams } from '../types/todo'

// 할 일 생성
export const createTodo = async (todoData: CreateTodoRequest): Promise<Todo> => {
  const response = await instance.post('/api/todos/', todoData)
  return response.data
}

// 모든 할 일 조회
export const getAllTodos = async (params?: GetAllTodosParams): Promise<Todo[]> => {
  const response = await instance.get('/api/todos/', { params })
  return response.data
}

// ID로 할 일 조회
export const getTodoById = async (todo_id: number): Promise<Todo> => {
  const response = await instance.get(`/api/todos/${todo_id}`)
  return response.data
}

// 할 일 정보 수정
export const updateTodo = async (todo_id: number, todoData: UpdateTodoRequest): Promise<Todo> => {
  const response = await instance.put(`/api/todos/${todo_id}`, todoData)
  return response.data
}

// 할일 삭제
export const deleteTodo = async (todo_id: number) => {
  const response = await instance.delete(`/api/todos/${todo_id}`)
  return response.data
}

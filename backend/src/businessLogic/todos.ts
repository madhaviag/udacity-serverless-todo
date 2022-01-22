import 'source-map-support/register'

import * as uuid from 'uuid'

import { TodosAccess } from '../dataLayer/TodosAccess'
//import { TodosStorage } from '../dataLayer/TodosStorage'
import { TodoItem } from '../models/TodoItem'
//import { TodoUpdate } from '../models/TodoUpdate'
//import { parseUserId } from '../auth/utils'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
//import { APIGatewayProxyEvent } from 'aws-lambda';


const logger = createLogger('todos')

const todosAccess = new TodosAccess()


export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`Retrieving all todos for user ${userId}`, { userId })

  return await todosAccess.getTodoItems(userId)
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
  const todoId = uuid.v4()

  const newItem: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest
  }

  logger.info(`Creating todo ${todoId} for user ${userId}`, { userId, todoId, todoItem: newItem })

  await todosAccess.createTodoItem(newItem)

  return newItem
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<Boolean> {
  return todosAccess.updateTodo(userId, todoId, updatedTodo)
}

export async function deleteTodo(userId: string, todoId: string): Promise<Boolean> {
  logger.info(`Deleting todo ${todoId} for user `, { todoId })

  return todosAccess.deleteTodo(userId, todoId)
}

export async function generateUploadUrl(todoId: string, userId: string): Promise<string> {
  logger.info(`INSIDE todos.ts `)
  return await todosAccess.generateUploadUrl(todoId, userId)
}

import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

const logger = createLogger('updateTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing updateTodo event', { event })

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  //const updatedToDo = await updateTodo(userId, todoID,updatedTodo );

  const success = await updateTodo(userId, todoId, updatedTodo)
  if(!success){
    return{
      statusCode: 500,
      body: "Error occured while updating Todo."
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true  
    },
    body: JSON.stringify({ msg: "T0-do has been updated", updated: updatedTodo })
  }
}

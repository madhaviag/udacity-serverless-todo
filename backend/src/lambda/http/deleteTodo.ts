import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId: string = getUserId(event)
    const success = await deleteTodo(userId, todoId)

    if (!success) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Error occurred while deleting Todo.'
        })
      }
    }
    return {
      statusCode: 204,
      body: JSON.stringify({
        message: "Todo deleted successfully."
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
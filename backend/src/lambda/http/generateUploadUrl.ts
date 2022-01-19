import 'source-map-support/register'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import { generateUploadUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'

const logger = createLogger('generateUploadUrl')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId: string = getUserId(event)

    // check for missing todo id
    if (!todoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({error: 'todoId was not provided'})
      }
    }

    const signedUrl = await generateUploadUrl(todoId, userId)

    logger.info(`Generated signed url for a TODO`, {
      url: signedUrl,
      todoId: todoId
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl: signedUrl
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
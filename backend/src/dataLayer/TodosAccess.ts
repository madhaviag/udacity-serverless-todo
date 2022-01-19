import 'source-map-support/register'

import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
//import * as AWSXRay from 'aws-xray-sdk'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('todosAccess')
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {

  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly S3 = new XAWS.S3({signatureVersion: 'v4'}),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosByUserIndex = process.env.TODOS_BY_USER_INDEX,
    private readonly bucket = process.env.ATTACHMENT_S3_BUCKET
  ) { }

  async todoItemExists(todoId: string): Promise<boolean> {
    const item = await this.getTodoItem(todoId)
    return !!item
  }

  async getTodoItems(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all todos for user ${userId} from ${this.todosTable}`)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosByUserIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items

    logger.info(`Found ${items.length} todos for user ${userId} in ${this.todosTable}`)

    return items as TodoItem[]
  }

  async getTodoItem(todoId: string): Promise<TodoItem> {
    logger.info(`Getting todo ${todoId} from ${this.todosTable}`)

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        todoId
      }
    }).promise()

    const item = result.Item

    return item as TodoItem
  }

  async createTodoItem(todoItem: TodoItem) {
    logger.info(`Putting todo ${todoItem.todoId} into ${this.todosTable}`)

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem,
    }).promise()
  }


  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<Boolean> {
    let isSuccess = false
    logger.info(`Updating todo item ${todoId} in ${this.todosTable}`)
    try {
      await this.docClient.update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
        ExpressionAttributeNames: {
          "#name": "name",
          "#dueDate": "dueDate",
          "#done": "done"

        },
        ExpressionAttributeValues: {
          ":name": todoUpdate.name,
          ":dueDate": todoUpdate.dueDate,
          ":done": todoUpdate.done
        }
      }).promise()
      isSuccess = true
    } catch (e) {
      logger.error('Error occurred while updating Todo.', {
        error: e,
        data: {
          userId,
          todoId,
          todoUpdate
        }
      })
    }
    return isSuccess

  }

  async deleteTodo(userId: string, todoId: string): Promise<Boolean> {
    let success = false
    logger.info(`Deleting todo item ${todoId} from ${this.todosTable}`)
    try {
      await this.docClient.delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
      }).promise()
      success = true
    } catch (e) {
      logger.info('Error occurred while deleting Todo from database', { error: e })

    }
    return success
  }

  async generateUploadUrl(todoId: string, userId: string): Promise<string> {
    //let attachmentUrl: string = 'https://' + process.env.S3_BUCKET + '.s3.amazonaws.com/' + todoId
    //logger.info(attachmentUrl);
    const uploadUrl = this.S3.getSignedUrl("putObject", {
      Bucket: this.bucket,
      Key: todoId,
      Expires: 300
  });
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'set attachmentUrl = :URL',
      ExpressionAttributeValues: {
        ":URL": uploadUrl.split("?")[0]
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()
    return uploadUrl;
  }

}

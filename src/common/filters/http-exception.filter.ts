import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Response } from 'express';
  import { CustomLogger } from '../logger/logger.service';
  
  @Catch(HttpException) // Importante: Capturar HttpException
  export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private logger: CustomLogger) {}
  
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
  
      const message =
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error';
      // Intercambiar stackTrace y context
      this.logger.error(
        `${request.method} ${request.url}`, // Mensaje
        exception instanceof Error ? exception.stack || '' : '' // Ensure stack is a string
      );
  
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    }
  }
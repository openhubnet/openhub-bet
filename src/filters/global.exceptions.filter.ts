//全局异常过滤器
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 600;
    console.log(exception);
    // 抛出错误信息
    const message = exception.message || exception.stack || null;
    const body =
      typeof request.body === 'object'
        ? request.body
          ? JSON.stringify(request.body)
          : ''
        : request.body;
    Logger.log(
      `全局异常日志：${request.method} ${request.url} ${body} cause: ${message}`,
    );

    response.status(status).json({
      code: status,
      msg: message,
      data: null,
    });
  }
}

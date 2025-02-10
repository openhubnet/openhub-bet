// common/interceptor/response.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
// 返回体结构
interface Response<T> {
  data: T;
}
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    // 解析ExecutionContext的数据内容获取到请求体
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    // 实现数据的遍历与转变
    Logger.log(request.url);
    return next.handle().pipe(
      map((data) => {
        return {
          code: 0,
          msg: 'Success',
          data: data,
        };
      }),
    );
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // 解析ExecutionContext的数据内容获取到请求体
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    // 实现数据的遍历与转变
    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }
}

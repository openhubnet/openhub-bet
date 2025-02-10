import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import LoggerConfig from './config/logger.config';
import { Logger } from '@nestjs/common';
import { RedisService } from './service/redis.service';
import helmet from 'helmet';
import { GlobalExceptionsFilter } from './filters/global.exceptions.filter';
async function bootstrap() {
  const env = process.env.NODE_ENV;
  if (!env || (env != 'development' && env != 'production')) {
    Logger.error('请指定运行环境:dev或pro');
    return;
  }
/*  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: LoggerConfig.create(),
  });*/
  const app = await NestFactory.create(AppModule,{
    logger: LoggerConfig.create(),
  });
  const redisService = app.get(RedisService);
  redisService.init();
  // 路径前缀：如：http://www.test.com/api/v1/user
  app.setGlobalPrefix('api/');
  //cors：跨域资源共享，方式一：允许跨站访问
  app.enableCors();
  // 方式二：const app = await NestFactory.create(AppModule, { cors: true });
  //防止跨站脚本攻击
  app.use(helmet());
  // 全局注册通用异常过滤器HttpExceptionFilter
  app.useGlobalFilters(new GlobalExceptionsFilter());
  // 全局权限验证守卫
  //app.useGlobalGuards(new AuthGuard());
  // 全局注册响应拦截器
  //app.useGlobalInterceptors(new ResponseInterceptor());

  const serverPot = process.env.SERVER_PORT
  Logger.log(`Server running at port: ${serverPot}, env:${env}`);
  //端口
  await app.listen(serverPot);
}
bootstrap();

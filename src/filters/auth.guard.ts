import {
  CanActivate,
  HttpException,
  Injectable,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //const request = context.switchToHttp().getRequest();
    const token = context.switchToRpc().getData().headers.authorization;
    if (token != process.env.AUTHORIZATION_TOKEN) {
      Logger.log(`Invalid token: ${token}`);
      throw new HttpException('Invalid authorization', HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}

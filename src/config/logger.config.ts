import * as winston from 'winston';
import { createLogger, Logger } from 'winston';
import { utilities, WinstonModule } from 'nest-winston';
import 'winston-daily-rotate-file';

export default class LoggerConfig {
  public static create() {
    // 日志配置
    const dirname = process.env.LOG_DIR
    const instance = createLogger({
      // 日志选项
      transports: [
        new winston.transports.Console({
          level: 'info',
          // 字符串拼接
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            utilities.format.nestLike(),
            // winston.format.splat(),
            // winston.format.printf((info) => {
            //   return `${info.timestamp} ${info.level}: [${info.label}]${info.message}`;
            // }),
            // winston.format.colorize({
            //   // I added this but it's still not helping
            //   all: false,
            //   message: false,
            //   level: false,
            // }),
            // winston.format.label({ label: 'API' }),
            // winston.format.printf(({ level, message, label, timestamp }) => {
            //   return `${timestamp} ${level}: ${message}`;
            // }),
          ),
        }),
        // warn、error日志存储到/logs/app-日期.log文件中
        new winston.transports.DailyRotateFile({
          level: 'warn',
          // 日志文件文件夹，建议使用path.join()方式来处理，或者process.cwd()来设置，此处仅作示范
          dirname: dirname,
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '200m',
          maxFiles: '5d',
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            utilities.format.nestLike(),
          ),
        }),
        // info日志存储到/logs/info-日期.log文件中
        new winston.transports.DailyRotateFile({
          level: 'info',
          // 日志文件文件夹，建议使用path.join()方式来处理，或者process.cwd()来设置，此处仅作示范
          dirname: dirname,
          filename: 'info-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '200m',
          maxFiles: '5d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple(),
          ),
        }),
      ],
    });
    return WinstonModule.createLogger({ instance });
  }
}

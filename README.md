<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript Project.

Listening for blockchain data changes

## Installation

```bash
$ yarn install

copy .env.example to .env
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Running in docker
```
1、请准备单机版redis，用docker安装redis也行
2、复制 copy .env.example 到 .env，并修改相应配置
3、docker build -t chain-observer .
4、docker run -itd -v <钱包数据库映射目录>:/data chain-observer yarn start:prod

other:
docker -H tcp://192.168.2.225:2375 build -t chain-observer-dev .
docker -H tcp://192.168.2.225:2375 run -itd --name chain-observer-dev -v /Users/xplus/workspace/data:/data chain-observer-dev yarn start:prod
```

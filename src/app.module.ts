import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import {TypeOrmModule} from '@nestjs/typeorm'
import {ConfigModule} from '@nestjs/config'
import { KmsService } from './kms/kms.service';
import { User } from './users/entities/user.entity';
import { UserSubscriber } from './users/user.subscriber';
import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true
    }), // for env variables
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: process.env.DB_PASS,
      database: 'enc_dec',
      entities: [User],
      synchronize: true,
    }),
    CacheModule.register({
      isGlobal:true
    }),
    UsersModule],
  controllers: [AppController],
  providers: [AppService, KmsService, UserSubscriber],
})
export class AppModule implements OnModuleInit{

  constructor(
    private readonly dataSource: DataSource,
    private readonly userSubscriber: UserSubscriber,
  ) {}
  onModuleInit() {
    this.dataSource.subscribers.push(this.userSubscriber);
  }

}

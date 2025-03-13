import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import {TypeOrmModule} from '@nestjs/typeorm'
import {ConfigModule} from '@nestjs/config'
import { KmsService } from './kms/kms.service';

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
      entities: [],
      synchronize: true,
    }),
    UsersModule],
  controllers: [AppController],
  providers: [AppService, KmsService],
})
export class AppModule {}

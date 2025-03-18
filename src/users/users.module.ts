import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { KmsModule } from 'src/kms/kms.module';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports:[KmsModule,
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UsersController],
  providers: [UsersService,UserSubscriber],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { KmsModule } from 'src/kms/kms.module';

@Module({
  imports:[KmsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

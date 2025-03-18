import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { KmsService } from 'src/kms/kms.service';

@Controller('/api')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly kmsService:KmsService
  ) {}

  @Post('/user')
  create(@Body() createUserDto: {name: string, email: string, password: string}) {
    return this.usersService.create(createUserDto);
  }

  @Get('/profile')
  myProfile(@Param('id') id: number) {
    return this.usersService.myProfile(id);
  }

  @Get('/encrypt')
  encrypt(@Query('data') data:any ) {
    return this.kmsService.encryptData(data);
  }

  @Post('/decrypt')
  decrypt(@Body('data') data: any) {
    return this.kmsService.decryptData(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

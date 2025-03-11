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

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('/encrypt')
  encrypt(@Query('data') data:any ) {
    console.log("encrypting...");
    console.log(data)
    return this.kmsService.encryptData(data);
  }

  @Get('/decrypt')
  decrypt(@Query('data') data: string,@Query('dek') dek:string) {
    console.log("Decrypting..")
    return this.kmsService.decryptData(data,dek);
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

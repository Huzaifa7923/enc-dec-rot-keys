import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ){}

  async create(createUserDto: {name: string, email: string, password: string}) {
    const user=this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  findAll() {
    return `This action returns all users`;
  }

  myProfile(userId: number) {
    return this.userRepository.findOne({where:{id:userId}});
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

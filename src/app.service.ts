import { Injectable, OnModuleInit } from '@nestjs/common';
import { KmsService } from './kms/kms.service';
@Injectable()
export class AppService implements OnModuleInit {

  constructor(
    private readonly kmsService: KmsService,
  ) {}

  async onModuleInit() {
    try{
    console.log("Checking if primary key version is used");
    const isPrimaryVersion = await this.kmsService.isPrimaryVersion();
    console.log(isPrimaryVersion);

    if(!isPrimaryVersion){
      console.log("Re-encrypting DEK");
      const newDek = await this.kmsService.reEncryptDek();
      console.log("New DEK: ",newDek);
    }else{
      console.log("Primary key version is used");
    }
    }catch(error){
      console.error('Error fetching current key version:', error);
    }
  }

    getHello() {
      return "Hello";
  }
}

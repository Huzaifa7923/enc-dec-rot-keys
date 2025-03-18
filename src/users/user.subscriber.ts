import { EntitySubscriberInterface, InsertEvent, LoadEvent } from "typeorm";
import { User } from "./entities/user.entity";
import { KmsService } from "src/kms/kms.service";
import { EventSubscriber } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {

    constructor(
        private readonly kmsService:KmsService){
    }    

    listenTo(): Function | string {
        return User;
    }
    async beforeInsert(event: InsertEvent<User>): Promise<void>{
        const { email, password } = event.entity;
        const data=await this.kmsService.encryptData(email);
        event.entity.email=data.data;
        const data2=await this.kmsService.encryptData(password);
        event.entity.password=data2.data;
    }

    async afterLoad(entity: User, event?: LoadEvent<User> | undefined): Promise<void> {
        const { email} = entity;
        const data=await this.kmsService.decryptData(email);
        entity.email=data;
    }
}   

//dragon fly
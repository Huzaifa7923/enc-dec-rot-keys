import { Module } from '@nestjs/common';
import { KmsService } from './kms.service';

@Module({
  providers: [KmsService], // Register service
  exports: [KmsService],   // Export service so other modules can use it
})
export class KmsModule {}

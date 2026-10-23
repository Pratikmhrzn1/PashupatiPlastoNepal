import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module.js';
import { AdminInquiriesController } from './admin-inquiries.controller.js';
import { ContactsController } from './contacts.controller.js';
import { InquiriesService } from './inquiries.service.js';
import { SpamService } from './spam.service.js';

@Module({
  imports: [MailModule],
  controllers: [ContactsController, AdminInquiriesController],
  providers: [InquiriesService, SpamService],
  exports: [InquiriesService],
})
export class InquiriesModule {}

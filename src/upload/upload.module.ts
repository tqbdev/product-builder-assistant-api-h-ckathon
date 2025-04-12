import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AiAgentModule } from 'src/ai-agent/ai-agent.module';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [AiAgentModule, SupabaseModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}

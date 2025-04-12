import { Injectable } from '@nestjs/common';
import { AiAgentService } from 'src/ai-agent/ai-agent.service';
import { SupabaseService } from 'src/supabase/supabase.service';
@Injectable()
export class UploadService {
  constructor(
    private readonly aiAgentService: AiAgentService,
  ) {}
  async parseFile(file: Express.Multer.File) {

    const invoiceData = await this.aiAgentService.processFile(file);

    return invoiceData;
  }
}

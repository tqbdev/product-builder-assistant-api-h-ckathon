import { Injectable } from '@nestjs/common';
import { AiAgentService } from 'src/ai-agent/ai-agent.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { v7 } from 'uuid';
@Injectable()
export class UploadService {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly supabaseService: SupabaseService,
  ) {}
  async parseFile(file: Express.Multer.File) {
    const { data, error } = await this.supabaseService
      .getClient()
      .schema('public')
      .from('files')
      .select('*');
    // const invoiceData = await this.aiAgentService.processFile(file);
    // const { data, error } = await this.supabaseService
    //   .getClient()
    //   .from('files')
    //   .insert({
    //     name: file.originalname,
    //     id: v7(),
    //     user_id: user.data.user?.id,
    //   })
    //   .select();
    return 'invoiceData';
  }
}

import { Injectable } from '@nestjs/common';
import { AiAgentService } from 'src/ai-agent/ai-agent.service';
@Injectable()
export class UploadService {
  constructor(
    private readonly aiAgentService: AiAgentService,
  ) {}
  async parseFile(file: Express.Multer.File) {

    const invoiceData = await this.aiAgentService.processFile(file);

    return invoiceData;
  }

  async parseToNotion(file: Express.Multer.File) {

    const blocks = await this.aiAgentService.parseToNotionBlocks(file);

    return blocks;
  }
}

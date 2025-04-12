import { Injectable } from "@nestjs/common";
import { AiAgentService } from "src/ai-agent/ai-agent.service";

@Injectable()
export class UploadService {
  constructor(private readonly aiAgentService: AiAgentService) {}
  async parseFiles(files: Express.Multer.File[]) {
    const result = await this.aiAgentService.processFileExcel(files[0]);
    return result;
  }
}

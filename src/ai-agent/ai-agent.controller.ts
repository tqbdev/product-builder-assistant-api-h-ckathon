import { Controller, Get, Query } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';

@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Get('ask')
  async ask(@Query('question') question: string): Promise<string> {
    return '123123';
  }
}

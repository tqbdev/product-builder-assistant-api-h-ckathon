import { Body, Controller, Post } from "@nestjs/common";
import { AiAgentService } from "./ai-agent.service";

@Controller("ai-agent")
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post("ask")
  async ask(@Body("message") question: string, @Body("data") data: any): Promise<any> {
    return this.aiAgentService.askQuesttion(question,data);
  }
}

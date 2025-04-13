import { Injectable } from "@nestjs/common";
import { AiAgentService } from "src/ai-agent/ai-agent.service";

@Injectable()
export class UploadService {
  constructor(private readonly aiAgentService: AiAgentService) {}
  async parseFiles(files: Express.Multer.File[]) {
    const excelFile = files.find((file) => file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const pdfFile = files.find((file) => file.mimetype === "application/pdf");

    const [resultExcel, resultPdf] = await Promise.all([
      this.aiAgentService.processFileExcel(excelFile),
      this.aiAgentService.processFilePDF(pdfFile)
    ]);

    return {
      excel: resultExcel,
      blocks: resultPdf
    };
  }

  async parseToNotion(file: Express.Multer.File) {

    const blocks = await this.aiAgentService.processFilePDF(file);

    return blocks;
  }
}

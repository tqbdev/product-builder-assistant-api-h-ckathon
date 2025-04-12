import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import { UploadService } from "./upload.service";

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("files")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: multer.memoryStorage(),
    })
  )
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      const result = await this.uploadService.parseFiles(files);

      return {
        message: "Success",
        data: result,
      };
    } catch (error) {
      return {
        message: "Error",
        error: error.message,
      };
    }
  }
}

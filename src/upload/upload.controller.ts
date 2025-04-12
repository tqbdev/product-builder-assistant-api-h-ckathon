import {
  Controller,
  Post,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UploadService } from './upload.service';

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

  @Post('parseToNotionBlocks')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async parseToNotionBlocks(@UploadedFile() file: Express.Multer.File) {
    try {
      const blocks = await this.uploadService.parseToNotion(file);
      return {
        message: 'Success',
        data: { blocks },
      };
    } catch (error) {
      return {
        message: 'Error',
        error: error.message,
      };
    }
  }
}

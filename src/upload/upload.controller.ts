import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const invoiceData = await this.uploadService.parseFile(file);
      return {
        message: 'Success',
        data: { invoiceData },
      };
    } catch (error) {
      return {
        message: 'Error',
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

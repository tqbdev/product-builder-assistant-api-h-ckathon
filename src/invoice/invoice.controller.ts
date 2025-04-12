import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CheckInvoiceDto } from './dto/check-invoice.dto';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('check')
  async checkInvoice(
    @Query(new ValidationPipe({ transform: true })) query: CheckInvoiceDto,
  ) {
    return await this.invoiceService.checkInvoice(query);
  }
}

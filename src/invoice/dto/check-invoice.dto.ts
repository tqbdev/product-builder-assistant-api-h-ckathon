import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CheckInvoiceDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.replace(/\s+/g, ''))
  taxCode: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.replace(/\s+/g, ''))
  invoiceSymbol: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.replace(/\s+/g, ''))
  invoiceNumber: string;

  @IsString()
  @Transform(({ value }) => value.replace(/\s+/g, ''))
  totalTax: string;

  @IsNotEmpty()
  @Transform(({ value }) => value.replace(/\s+/g, ''))
  @IsString()
  totalBill: string;
}

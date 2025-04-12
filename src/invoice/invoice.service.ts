import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AiAgentService } from 'src/ai-agent/ai-agent.service';
import { removeStrokeFromSVG, svgToBase64 } from './utils';
import * as https from 'https';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ConfigService } from '@nestjs/config';
import { HumanMessage } from '@langchain/core/messages';
const agent = new https.Agent({
  rejectUnauthorized: false, // This disables certificate validation
});

const MAX_RETRIES = 5;
export interface InvoiceData {
  taxCode: string;
  invoiceSymbol: string;
  invoiceNumber: string;
  totalTax: string;
  totalBill: string;
  isValid?: boolean;
  isProcessing?: boolean;
}
@Injectable()
export class InvoiceService {
  private model: ChatGoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-lite',
      apiKey: this.configService.get<string>('GOOGLE_API_KEY'),
      temperature: 1.5,
    });
  }

  getCaptcha = async (): Promise<{ key: string; content: string }> => {
    const response = await axios.get(
      `https://hoadondientu.gdt.gov.vn:30000/captcha`,
      { httpAgent: agent },
    );
    const { key, content } = response.data;
    return {
      key,
      content: removeStrokeFromSVG(content),
    };
  };

  parseCaptcha = async (): Promise<{ key: string; captcha: string }> => {
    const { key, content } = await this.getCaptcha();
    const pngBase64 = await svgToBase64(content);

    const response = await this.model.invoke([
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: `Extract the text from this captcha image and return only the text without any additional explanation.
            Remember this captcha is 6 characters long.
            Remember this captcha is case sensitive.
            `,
          },
          {
            type: 'image_url',
            image_url: {
              url: pngBase64,
            },
          },
        ],
      }),
    ]);
    return {
      key,
      captcha: response.content.toString().replace('\n', ''),
    };
  };

  async checkInvoice(
    invoiceData: InvoiceData,
  ): Promise<{ message: string; result: string; isValid: boolean }> {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const { key, captcha } = await this.parseCaptcha();
        const url = `https://hoadondientu.gdt.gov.vn:30000/query/guest-invoices?`;
        const params = {
          khmshdon: '1',
          hdon: '01',
          nbmst: invoiceData.taxCode,
          khhdon: invoiceData.invoiceSymbol,
          shdon: invoiceData.invoiceNumber,
          tgtttbso: invoiceData.totalBill,
          cvalue: captcha,
          ckey: key,
        };
        const response = await axios.get(url, { params, httpAgent: agent });
        if (
          response.data &&
          'hdon' in response.data &&
          response.status === 200
        ) {
          return { message: 'Success', result: response.data, isValid: true };
        } else if (response.status === 200) {
          // invalid invoice info
          return {
            message: 'Success',
            result: 'invoice invalid data',
            isValid: false,
          };
        } else {
          retries++;
          console.log(
            `Retrying with another captcha for invoice number ${invoiceData.invoiceNumber} (${retries}/${MAX_RETRIES})`,
          );
        }
      } catch (error: any) {
        retries++;
        console.log(
          `Retrying by error for invoice number ${invoiceData.invoiceNumber}  (${retries}/${MAX_RETRIES})`,
          error.message,
        );
        // return { message: 'Error', result: error.message, isValid: false };
      }
    }
    return { message: 'Failed', result: 'max retries', isValid: false };
  }
}

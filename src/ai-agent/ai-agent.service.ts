import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, MessageContent } from '@langchain/core/messages';
import * as sharp from 'sharp';
import * as pdf from 'pdf-parse';
import { v7 } from 'uuid';
export interface InvoiceData {
  id?: string;
  taxCode: string;
  invoiceSymbol: string;
  invoiceNumber: string;
  totalTax: string;
  totalBill: string;
  isValid?: boolean;
  isProcessing?: boolean;
}
@Injectable()
export class AiAgentService {
  private model: ChatGoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-lite',
      apiKey: this.configService.get<string>('GOOGLE_API_KEY'),
      temperature: 1.5,
    });
  }

  async pdfToBase64(file: Express.Multer.File): Promise<any> {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  async extractTextFromPdf(file: Express.Multer.File): Promise<any> {
    const data = await pdf(file.buffer);
    const extractedText = data.text;
    return extractedText;
  }
  parseGeminiJSON(response: string): InvoiceData[] {
    const cleanedResponse = response.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedResponse);
  }

  async processFile(file: Express.Multer.File): Promise<InvoiceData[]> {
    let content = await this.extractTextFromPdf(file);
    if (!content || content.length === 0 || content.length < 100) {
      content = await this.pdfToBase64(file);
    }
    const response = await this.askAiAgentWithFile(content);
    const jsonObject = this.parseGeminiJSON(response);
    jsonObject.forEach((invoice) => {
      invoice.id = v7();
      invoice.invoiceSymbol = invoice.invoiceSymbol.slice(-6);
    });
    return jsonObject;
  }

  async svgToBase64(base64Svg: string): Promise<string> {
    const svgBuffer = Buffer.from(base64Svg.split(',')[1], 'base64');
    const pngBuffer = await sharp(svgBuffer, { density: 6000 })
      .resize({ width: 2000 })
      .png()
      .toBuffer();
    const base64Data = pngBuffer.toString('base64');
    return `data:image/png;base64,${base64Data}`;
  }

  async askAiAgentWithImages(base64Image: string): Promise<any> {
    const imageBuffer = await this.svgToBase64(base64Image);
    const response = await this.model.invoke([
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: 'Extract the text from this captcha image and return only the text without any additional explanation.',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBuffer,
            },
          },
        ],
      }),
    ]);
    return response.content;
  }

  async askAiAgentWithFile(fileContent: string): Promise<any> {
    const content: MessageContent = [
      {
        type: 'text',
        text: `The attached file maybe contain multiple invoice. 
        Extract the invoice details and return only a valid JSON object, without code blocks, backticks,
       or extra formatting. The response should be a list of JSON object with the following format: 
            {
          taxCode: string;
          invoiceSymbol: string;
          invoiceNumber: string;
          totalTax: string;
          totalBill: string;
            },
      After that, you must return a valid JSON object with the following format:
        with taxCode you must use the taxCode of the seller (usually first appear in the invoice) (do not use taxCode of buyer) that appears in each invoice.
        with invoiceSymbol you must remove the first character of invoiceSymbol that appears in each invoice. The result of InvoiceSymbol only have 6 characters.
        with invoiceNumber you must remove all remove leading zeros.
        with totalTax and totalBill you must remove all commas and dots.
      `,
      },
    ];

    if (fileContent.startsWith('data:')) {
      // pdf base 6
      content.push({
        type: 'image_url',
        image_url: {
          url: fileContent,
        },
      });
    } else {
      content.push({
        type: 'text',
        text: fileContent,
      });
    }

    const response = await this.model.invoke([new HumanMessage({ content })]);
    return response.content;
  }

  async invoke(messages: HumanMessage[]): Promise<any> {
    const response = await this.model.invoke(messages);
    return response;
  }
}

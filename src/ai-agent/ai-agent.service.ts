import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, MessageContent } from "@langchain/core/messages";
import * as pdf from "pdf-parse";
import { v7 } from "uuid";
import * as ExcelToJson from "convert-excel-to-json";

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
      model: "gemini-2.0-flash",
      apiKey: this.configService.get<string>("GOOGLE_API_KEY"),
      temperature: 1,
      topP: 0.95,
      topK: 40,
    });
  }

  async pdfToBase64(file: Express.Multer.File): Promise<any> {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  }

  async extractTextFromPdf(file: Express.Multer.File): Promise<any> {
    const data = await pdf(file.buffer);
    const extractedText = data.text;
    return extractedText;
  }

  parseGeminiJSON(response: string): InvoiceData[] {
    const cleanedResponse = response.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanedResponse);
  }

  convertExcelToJson(file: Express.Multer.File): Record<string, any> {
    const data = ExcelToJson({
      source: file.buffer,
    });
    return data;
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

  async processFileExcel(file: Express.Multer.File): Promise<any> {
    const content = await this.convertExcelToJson(file);
    const response = await this.askAiAgentGetLogic(JSON.stringify(content));
    const jsonObject = this.parseGeminiJSON(response);
    return jsonObject;
  }

  async askAiAgentGetLogic(fileContent: string): Promise<any> {
    const content: MessageContent = [
      {
        type: "text",
        text: `
        The following content is the excel file that contains the logic to calculate the premium of an insurance product.
        Give me the JS code to calculate premium and the user input JSON schema.
        Only return the valid JS code object without any additional explanation or formatting.
        This is example of the output:
        \`\`\`json
        {
          "userInputSchema": {
            "type": "object",
            "properties": {
              "coverageType": {
                "type": "string",
                "enum": [
                  "Single Journey",
                  "Annual"
                ],
                "description": "Type of coverage"
              },
              "planLevel": {
                "type": "string",
                "enum": [
                  "Standard",
                  "Premier",
                  "Privilege"
                ],
                "description": "Plan level"
              },
              "numberOfAdults": {
                "type": "integer",
                "minimum": 0,
                "description": "Number of adults (18-70)"
              },
              "numberOfSeniors": {
                "type": "integer",
                "minimum": 0,
                "description": "Number of seniors (>70)"
              },
              "numberOfChildren": {
                "type": "integer",
                "minimum": 0,
                "description": "Number of children (<18)"
              },
              "tripDuration": {
                "type": "integer",
                "minimum": 1,
                "description": "Trip duration in days (only for Single Journey)"
              },
              "optionalCruiseCover": {
                "type": "boolean",
                "description": "Whether optional cruise cover is selected"
              },
              "upgradeChildLimits": {
                "type": "boolean",
                "description": "Whether to upgrade child limits"
              },
              "levyRate": {
                "type": "number",
                "description": "Levy rate"
              }
            },
            "required": [
              "coverageType",
              "planLevel",
              "numberOfAdults",
              "numberOfSeniors",
              "numberOfChildren",
              "tripDuration",
              "optionalCruiseCover",
              "upgradeChildLimits",
              "levyRate"
            ]
          },
          "jsCode": {
            "type": "function",
            "definition": "function calculatePremium(userInput) {\n  const {\n    coverageType,\n    planLevel,\n    numberOfAdults,\n    numberOfSeniors,\n    numberOfChildren,\n    tripDuration,\n    optionalCruiseCover,\n    upgradeChildLimits,\n    levyRate\n  } = userInput;\n\n  let basePremium = 0;\n  let cruiseOptionPremium = 0;\n  let childUpgradeOptionPremium = 0;\n  let totalOptionsPremium = 0;\n  let totalPremiumBeforeLevy = 0;\n  let levyAmount = 0;\n  let finalPremiumPayable = 0;\n\n  // Rate Tables (replace with actual data loading/access mechanism)\n  const singleJourneyRates = [\n    {\n      planLevel: 'Standard',\n      durationBandLower: 1,\n      durationBandUpper: 5,\n      ageGroup: 'Adult_18_70',\n      basePremium: 100\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 1,\n      durationBandUpper: 5,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 120\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 6,\n      durationBandUpper: 10,\n      ageGroup: 'Adult_18_70',\n      basePremium: 150\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 6,\n      durationBandUpper: 10,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 180\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 11,\n      durationBandUpper: 15,\n      ageGroup: 'Adult_18_70',\n      basePremium: 200\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 11,\n      durationBandUpper: 15,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 240\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 16,\n      durationBandUpper: 30,\n      ageGroup: 'Adult_18_70',\n      basePremium: 250\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 16,\n      durationBandUpper: 30,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 300\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 31,\n      durationBandUpper: 60,\n      ageGroup: 'Adult_18_70',\n      basePremium: 300\n    },\n    {\n      planLevel: 'Standard',\n      durationBandLower: 31,\n      durationBandUpper: 60,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 360\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 1,\n      durationBandUpper: 5,\n      ageGroup: 'Adult_18_70',\n      basePremium: 180\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 1,\n      durationBandUpper: 5,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 220\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 6,\n      durationBandUpper: 10,\n      ageGroup: 'Adult_18_70',\n      basePremium: 250\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 6,\n      durationBandUpper: 10,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 300\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 11,\n      durationBandUpper: 15,\n      ageGroup: 'Adult_18_70',\n      basePremium: 320\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 11,\n      durationBandUpper: 15,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 380\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 16,\n      durationBandUpper: 30,\n      ageGroup: 'Adult_18_70',\n      basePremium: 400\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 16,\n      durationBandUpper: 30,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 480\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 31,\n      durationBandUpper: 60,\n      ageGroup: 'Adult_18_70',\n      basePremium: 480\n    },\n    {\n      planLevel: 'Premier',\n      durationBandLower: 31,\n      durationBandUpper: 60,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 580\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 1,\n      durationBandUpper: 5,\n      ageGroup: 'Adult_18_70',\n      basePremium: 250\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 1,\n      durationBandUpper: 5,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 300\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 6,\n      durationBandUpper: 10,\n      ageGroup: 'Adult_18_70',\n      basePremium: 350\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 6,\n      durationBandUpper: 10,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 420\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 11,\n      durationBandUpper: 15,\n      ageGroup: 'Adult_18_70',\n      basePremium: 450\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 11,\n      durationBandUpper: 15,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 540\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 16,\n      durationBandUpper: 30,\n      ageGroup: 'Adult_18_70',\n      basePremium: 550\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 16,\n      durationBandUpper: 30,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 660\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 31,\n      durationBandUpper: 60,\n      ageGroup: 'Adult_18_70',\n      basePremium: 650\n    },\n    {\n      planLevel: 'Privilege',\n      durationBandLower: 31,\n      durationBandUpper: 60,\n      ageGroup: 'Senior_Over_70',\n      basePremium: 780\n    }\n  ];\n\n  const annualRates = [\n    {\n      planLevel: 'Standard',\n      coverageStructure: 'Individual_Adult_18_70',\n      basePremium: 1000\n    },\n    {\n      planLevel: 'Standard',\n      coverageStructure: 'Individual_Senior_Over_70',\n      basePremium: 1200\n    },\n    {\n      planLevel: 'Standard',\n      coverageStructure: 'Family',\n      basePremium: 2500\n    },\n    {\n      planLevel: 'Premier',\n      coverageStructure: 'Individual_Adult_18_70',\n      basePremium: 1500\n    },\n    {\n      planLevel: 'Premier',\n      coverageStructure: 'Individual_Senior_Over_70',\n      basePremium: 1800\n    },\n    {\n      planLevel: 'Premier',\n      coverageStructure: 'Family',\n      basePremium: 3800\n    },\n    {\n      planLevel: 'Privilege',\n      coverageStructure: 'Individual_Adult_18_70',\n      basePremium: 2200\n    },\n    {\n      planLevel: 'Privilege',\n      coverageStructure: 'Individual_Senior_Over_70',\n      basePremium: 2600\n    },\n    {\n      planLevel: 'Privilege',\n      coverageStructure: 'Family',\n      basePremium: 5500\n    }\n  ];\n\n  const optionRates = [\n    {\n      optionType: 'Cruise',\n      planLevel: 'Premier',\n      coverageType: 'Single Journey',\n      coverageStructure: 'PerPerson',\n      optionPremium: 80\n    },\n    {\n      optionType: 'Cruise',\n      planLevel: 'Privilege',\n      coverageType: 'Single Journey',\n      coverageStructure: 'PerPerson',\n      optionPremium: 120\n    },\n    {\n      optionType: 'Cruise',\n      planLevel: 'Premier',\n      coverageType: 'Annual',\n      coverageStructure: 'PerPolicy',\n      optionPremium: 300\n    },\n    {\n      optionType: 'Cruise',\n      planLevel: 'Privilege',\n      coverageType: 'Annual',\n      coverageStructure: 'PerPolicy',\n      optionPremium: 500\n    },\n    {\n      optionType: 'ChildUpgrade',\n      planLevel: 'Standard',\n      coverageType: 'Single Journey',\n      coverageStructure: 'PerChild',\n      optionPremium: 50\n    },\n    {\n      optionType: 'ChildUpgrade',\n      planLevel: 'Premier',\n      coverageType: 'Single Journey',\n      coverageStructure: 'PerChild',\n      optionPremium: 80\n    },\n    {\n      optionType: 'ChildUpgrade',\n      planLevel: 'Privilege',\n      coverageType: 'Single Journey',\n      coverageStructure: 'PerChild',\n      optionPremium: 110\n    },\n    {\\n      optionType: 'ChildUpgrade',\n      planLevel: 'Standard',\n      coverageType: 'Annual',\n      coverageStructure: 'PerChild',\n      optionPremium: 100\n    },\n    {\n      optionType: 'ChildUpgrade',\n      planLevel: 'Premier',\n      coverageType: 'Annual',\n      coverageStructure: 'PerChild',\n      optionPremium: 150\n    },\n    {\n      optionType: 'ChildUpgrade',\n      planLevel: 'Privilege',\n      coverageType: 'Annual',\n      coverageStructure: 'PerChild',\n      optionPremium: 200\n    }\n  ];\n\n  if (coverageType === 'Single Journey') {\n    // Determine duration band\n    let durationBand = null;\n    if (tripDuration >= 1 && tripDuration <= 5) {\n      durationBand = { lower: 1, upper: 5 };\n    } else if (tripDuration >= 6 && tripDuration <= 10) {\n      durationBand = { lower: 6, upper: 10 };\n    } else if (tripDuration >= 11 && tripDuration <= 15) {\n      durationBand = { lower: 11, upper: 15 };\n    } else if (tripDuration >= 16 && tripDuration <= 30) {\n      durationBand = { lower: 16, upper: 30 };\n    } else if (tripDuration >= 31 && tripDuration <= 60) {\n      durationBand = { lower: 31, upper: 60 };\n    }\n\n    if (!durationBand) {\n      throw new Error('Invalid trip duration for Single Journey');\n    }\n\n    // Calculate base premium for adults\n    const adultRate = singleJourneyRates.find(\n      (rate) =>\n        rate.planLevel === planLevel &&\n        rate.durationBandLower === durationBand.lower &&\n        rate.durationBandUpper === durationBand.upper &&\n        rate.ageGroup === 'Adult_18_70'\n    );\n    if (adultRate) {\n      basePremium += adultRate.basePremium * numberOfAdults;\n    }\n\n    // Calculate base premium for seniors\n    const seniorRate = singleJourneyRates.find(\n      (rate) =>\n        rate.planLevel === planLevel &&\n        rate.durationBandLower === durationBand.lower &&\n        rate.durationBandUpper === durationBand.upper &&\n        rate.ageGroup === 'Senior_Over_70'\n    );\n    if (seniorRate) {\n      basePremium += seniorRate.basePremium * numberOfSeniors;\n    }\n\n    //Cruise Option Premium\n    if (optionalCruiseCover) {\n      const cruiseRate = optionRates.find(\n        (rate) =>\n          rate.optionType === 'Cruise' &&\n          rate.planLevel === planLevel &&\n          rate.coverageType === 'Single Journey'\n      );\n      if (cruiseRate) {\n        cruiseOptionPremium = cruiseRate.optionPremium * (numberOfAdults + numberOfSeniors + numberOfChildren);\n      }\n    }\n\n    //Child Upgrade Premium\n    if (upgradeChildLimits) {\n      const childUpgradeRate = optionRates.find(\n        (rate) =>\n          rate.optionType === 'ChildUpgrade' &&\n          rate.planLevel === planLevel &&\n          rate.coverageType === 'Single Journey'\n      );\n      if (childUpgradeRate) {\n        childUpgradeOptionPremium = childUpgradeRate.optionPremium * numberOfChildren;\n      }\n    }\n  } else if (coverageType === 'Annual') {\n    let coverageStructure = 'Family';\n\n    if (numberOfChildren === 0) {\n      coverageStructure = 'Individual_Adult_18_70';\n    }\n\n    if (numberOfAdults === 1 && numberOfSeniors === 0 && numberOfChildren === 0) {\n       coverageStructure = 'Individual_Adult_18_70';\n    }\n    else if(numberOfAdults===0 && numberOfSeniors ===1 && numberOfChildren === 0){\n      coverageStructure = 'Individual_Senior_Over_70'\n    }\n    else if (numberOfAdults === 0 && numberOfSeniors > 0) {\n      coverageStructure = 'Individual_Senior_Over_70';\n    } else if (numberOfAdults > 0 && numberOfSeniors === 0 && numberOfChildren === 0) {\n      coverageStructure = 'Individual_Adult_18_70';\n    }\n    const annualRate = annualRates.find(\n      (rate) =>\n        rate.planLevel === planLevel &&\n        rate.coverageStructure === coverageStructure\n    );\n    if (annualRate) {\n      basePremium = annualRate.basePremium;\n    }\n      //Cruise Option Premium\n      if (optionalCruiseCover) {\n        const cruiseRate = optionRates.find(\n          (rate) =>\n            rate.optionType === 'Cruise' &&\n            rate.planLevel === planLevel &&\n            rate.coverageType === 'Annual'\n        );\n        if (cruiseRate) {\n          cruiseOptionPremium = cruiseRate.optionPremium;\n        }\n      }\n        //Child Upgrade Premium\n        if (upgradeChildLimits) {\n          const childUpgradeRate = optionRates.find(\n            (rate) =>\n              rate.optionType === 'ChildUpgrade' &&\n              rate.planLevel === planLevel &&\n              rate.coverageType === 'Annual'\n          );\n          if (childUpgradeRate) {\n            childUpgradeOptionPremium = childUpgradeRate.optionPremium * numberOfChildren;\n          }\n        }\n  }\n\n  totalOptionsPremium = cruiseOptionPremium + childUpgradeOptionPremium;\n  totalPremiumBeforeLevy = basePremium + totalOptionsPremium;\n  levyAmount = totalPremiumBeforeLevy * levyRate;\n  finalPremiumPayable = totalPremiumBeforeLevy + levyAmount;\n\n  return {\n    basePremium,\n    cruiseOptionPremium,\n    childUpgradeOptionPremium,\n    totalOptionsPremium,\n    totalPremiumBeforeLevy,\n    levyAmount,\n    finalPremiumPayable,\n  };\n}"
          }
        }
\`\`\`        
      `,
      },
    ];

    content.push({
      type: "text",
      text: fileContent,
    });

    const response = await this.model.invoke([new HumanMessage({ content })]);
    return response.content;
  }

  async askAiAgentWithFile(fileContent: string): Promise<any> {
    const content: MessageContent = [
      {
        type: "text",
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

    if (fileContent.startsWith("data:")) {
      // pdf base 6
      content.push({
        type: "image_url",
        image_url: {
          url: fileContent,
        },
      });
    } else {
      content.push({
        type: "text",
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

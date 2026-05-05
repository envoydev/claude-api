import Anthropic from '@anthropic-ai/sdk';
import {
  AssistantMessage,
  AssistantMessageCreateParams,
  AssistantMessageParam,
  AssistantMessageStream,
  AssistantRequest,
  AssistantResponse,
  ChatParams,
} from './ai-assistant.type';
import path from 'path';
import fs from 'fs';

export class AiAssistant {
  private readonly client: Anthropic;
  private readonly messages: AssistantMessageParam[] = [];
  private readonly maxTokens = 6001;
  private readonly maxThinkingTokens = 6000;
  private readonly model = 'claude-haiku-4-5';

  private systemPrompt: string | undefined = undefined;
  private temperature: number = 0.5;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  public get modelName(): string {
    return this.model;
  }

  /**
   * Retrieves the thinking test string. Enabling reducted_thinking
   * @return A predefined string used for testing thinking functionality.
   */
  public get ThinkingTestString(): string {
    return 'ANTHROPIC_MAGIC_STRING_TRIGGER_REDACTED_THINKING_46C9A13E193C177646C7398A98432ECCCE4C1253D5E2D82641AC0E52CC2876CB';
  }

  public getMessages(): AssistantMessageParam[] {
    return this.messages;
  }

  public getTextFromResponse(response: AssistantResponse): string {
    return response
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');
  }

  public setSystemPrompt(prompt: string | undefined) {
    this.systemPrompt = prompt;
  }

  public setTemperature(temperature: number) {
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }
    this.temperature = temperature;
  }

  public addUserMessage(message: AssistantRequest) {
    const assistantMessage: AssistantMessageParam = {
      role: 'user',
      content: message,
    };
    this.messages.push(assistantMessage);
  }

  public addAssistantMessage(message: AssistantRequest) {
    const assistantMessage: AssistantMessageParam = {
      role: 'assistant',
      content: message,
    };
    this.messages.push(assistantMessage);
  }

  public async chat(chatParams?: ChatParams): Promise<AssistantMessage> {
    const chatObject = this.generateChatObject(chatParams);
    const result = await this.client.messages.create(chatObject);
    return result as AssistantMessage;
  }

  public async chatStream(
    chatParams?: ChatParams,
  ): Promise<AssistantMessageStream> {
    const chatObject = this.generateChatObject(chatParams);
    return this.client.messages.stream(chatObject);
  }

  public async upload(filePath: string): Promise<any> {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = this.getMimeTypeMap()[ext];
    if (!mimeType) {
      throw new Error(`Unknown mimetype for extension: ${ext}`);
    }
    const filename = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const blob = new Blob([fileContent], { type: mimeType });
    return this.client.beta.files.upload({
      file: new File([blob], filename, { type: mimeType }),
    });
  }

  public async listFiles(): Promise<any> {
    return this.client.beta.files.list();
  }

  public async deleteFile(id: string): Promise<any> {
    return this.client.beta.files.delete(id);
  }

  public async downloadFile(
    id: string,
    pathToFile: string,
    fileName?: string,
  ): Promise<void> {
    const fileContent = await this.client.beta.files.download(id);
    fileName ??= (await this.getMetadata(id)).filename;
    const fileDirectory = path.dirname(pathToFile);
    if (fileDirectory && fileDirectory !== '.') {
      fs.mkdirSync(fileDirectory, { recursive: true });
    }
    const pathForFile = path.join(fileDirectory, fileName!);
    const buffer = Buffer.from(await fileContent.arrayBuffer());
    fs.writeFileSync(pathForFile, buffer);
  }

  public async getMetadata(id: string): Promise<any> {
    return this.client.beta.files.retrieveMetadata(id);
  }

  private generateChatObject(
    chatParams?: ChatParams,
  ): AssistantMessageCreateParams {
    const requestBody: AssistantMessageCreateParams = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: this.messages,
      temperature: chatParams?.thinking ? 1.0 : this.temperature,
    };
    if (Boolean(chatParams?.thinking)) {
      requestBody.thinking = {
        type: 'enabled',
        budget_tokens: this.maxThinkingTokens,
      };
    }
    if (Boolean(chatParams?.tools)) {
      const tools = chatParams!.tools!;
      const toolsCopy = [...tools];
      const lastTool = { ...toolsCopy[toolsCopy.length - 1] };
      lastTool.cache_control = { type: 'ephemeral' };
      toolsCopy[toolsCopy.length - 1] = lastTool;
      requestBody.tools = toolsCopy;
    }
    if (Boolean(this.systemPrompt)) {
      requestBody.system = [
        {
          type: 'text',
          text: this.systemPrompt!,
          cache_control: { type: 'ephemeral' },
        },
      ];
    }
    if (!!chatParams?.stopSequence && chatParams?.stopSequence.length > 1) {
      this.addAssistantMessage(chatParams.stopSequence[0]);
      requestBody.stop_sequences = [chatParams.stopSequence[1]];
    }
    return requestBody;
  }

  private getMimeTypeMap(): Record<string, string> {
    return {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/plain',
      '.py': 'text/plain',
      '.js': 'text/plain',
      '.html': 'text/plain',
      '.css': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
  }
}

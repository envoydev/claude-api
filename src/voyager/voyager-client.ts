import { VoyageAIClient } from 'voyageai';

export class VoyagerClient {
  private readonly client: VoyageAIClient;
  private readonly model = 'voyage-3-large';

  constructor() {
    this.client = new VoyageAIClient({ apiKey: process.env.VOYAGER_API_KEY });
  }

  public async generateEmbedding(
    text: string | string[],
    inputType: 'query' | 'document' = 'query',
  ): Promise<number[]> {
    const model = this.model;
    const result = await this.client.embed({
      input: Array.isArray(text) ? text : [text],
      model,
      inputType,
    });
    return result.data![0].embedding as number[];
  }

  public async generateEmbeddings(
    text: string[],
    inputType: 'query' | 'document' = 'query',
  ): Promise<number[][]> {
    const model = this.model;
    const result = await this.client.embed({
      input: text,
      model,
      inputType,
    });
    return result.data!.map((x) => x.embedding as number[]);
  }
}

import { SearchIndex, Document, SearchResult } from './store.types';

export class BM25Index implements SearchIndex {
  private readonly termFrequencySaturation: number;
  private readonly docLengthPenalty: number;
  private readonly tokenizer: BM25IndexTokenizer;

  private documents: Document[] = [];
  private corpusTokens: string[][] = [];
  private docLengths: number[] = [];
  private docFrequencies: Map<string, number> = new Map();
  private avgDocLen = 0.0;
  private inverseDocumentFrequency: Map<string, number> = new Map();
  private indexBuilt = false;

  constructor(
    termFrequencySaturation = 1.5,
    docLengthPenalty = 0.75,
    tokenizer?: BM25IndexTokenizer,
  ) {
    this.termFrequencySaturation = termFrequencySaturation;
    this.docLengthPenalty = docLengthPenalty;
    this.tokenizer = tokenizer ?? this.defaultTokenizer;
  }

  public get length(): number {
    return this.documents.length;
  }

  public addDocument(document: Document): void {
    if (typeof document !== 'object' || document === null) {
      throw new TypeError('Document must be an object.');
    }
    if (!('content' in document)) {
      throw new Error("Document must contain a 'content' key.");
    }
    if (typeof document.content !== 'string') {
      throw new TypeError("Document 'content' must be a string.");
    }
    const tokens = this.tokenizer(document.content);
    this.documents.push(document);
    this.corpusTokens.push(tokens);
    this.updateStatsOnAdd(tokens);
  }

  public addDocuments(documents: Document[]): void | Promise<void> {
    for (const document of documents) {
      this.addDocument(document);
    }
  }

  public search(
    queryText: string,
    k = 1,
    scoreNormalizationFactor = 0.1,
  ): SearchResult[] {
    if (this.documents.length === 0) {
      return [];
    }
    if (k <= 0) {
      throw new Error('k must be a positive integer.');
    }
    if (!this.indexBuilt) {
      this.buildIndex();
    }
    if (this.avgDocLen === 0) {
      return [];
    }
    const queryTokens = this.tokenizer(queryText);
    if (queryTokens.length === 0) {
      return [];
    }
    const rawScores: [number, Document][] = [];
    for (let i = 0; i < this.documents.length; i++) {
      const score = this.computeBM25Score(queryTokens, i);
      if (score > 1e-9) {
        rawScores.push([score, this.documents[i]]);
      }
    }
    rawScores.sort(([a], [b]) => b - a);
    return rawScores
      .slice(0, k)
      .map(([rawScore, doc]) => {
        const normalized = Math.exp(-scoreNormalizationFactor * rawScore);
        return [doc, normalized] as SearchResult;
      })
      .sort(([, a], [, b]) => a - b);
  }

  public toString(): string {
    return `BM25Index(count=${this.length}, termFrequencySaturation=${this.termFrequencySaturation}, docLengthPenalty=${this.docLengthPenalty}, index_built=${this.indexBuilt})`;
  }

  private defaultTokenizer(text: string): string[] {
    return text.toLowerCase().split(/\W+/).filter(Boolean);
  }

  private updateStatsOnAdd(docTokens: string[]): void {
    this.docLengths.push(docTokens.length);
    const seenInDoc = new Set<string>();
    for (const token of docTokens) {
      if (!seenInDoc.has(token)) {
        this.docFrequencies.set(
          token,
          (this.docFrequencies.get(token) ?? 0) + 1,
        );
        seenInDoc.add(token);
      }
    }
    this.indexBuilt = false;
  }

  private buildIndex(): void {
    if (this.documents.length === 0) {
      this.avgDocLen = 0.0;
      this.inverseDocumentFrequency.clear();
      this.indexBuilt = true;
      return;
    }
    this.avgDocLen =
      this.docLengths.reduce((a, b) => a + b, 0) / this.documents.length;
    this.calculateIdf();
    this.indexBuilt = true;
  }

  private calculateIdf(): void {
    const N = this.documents.length;
    this.inverseDocumentFrequency.clear();
    for (const [term, freq] of this.docFrequencies) {
      this.inverseDocumentFrequency.set(
        term,
        Math.log((N - freq + 0.5) / (freq + 0.5) + 1),
      );
    }
  }

  private computeBM25Score(queryTokens: string[], docIndex: number): number {
    const docTokens = this.corpusTokens[docIndex];
    const docLength = this.docLengths[docIndex];
    const termCounts = new Map<string, number>();
    for (const token of docTokens) {
      termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
    }
    let score = 0.0;
    for (const token of queryTokens) {
      const wordRarity = this.inverseDocumentFrequency.get(token);
      if (wordRarity === undefined) {
        continue;
      }
      const termFreq = termCounts.get(token) ?? 0;
      const numerator =
        wordRarity * termFreq * (this.termFrequencySaturation + 1);
      const denominator =
        termFreq +
        this.termFrequencySaturation *
          (1 -
            this.docLengthPenalty +
            this.docLengthPenalty * (docLength / this.avgDocLen));
      score += numerator / (denominator + 1e-9);
    }
    return score;
  }
}

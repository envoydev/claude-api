import {
  SearchIndex,
  Document,
  SearchResult,
  DocRankEntry,
} from './store.types';

export class Retriever implements SearchIndex {
  private readonly indexes: SearchIndex[];

  constructor(...indexes: SearchIndex[]) {
    if (indexes.length === 0) {
      throw new Error('At least one index must be provided.');
    }
    this.indexes = indexes;
  }

  public async addDocument(document: Document): Promise<void> {
    for (const index of this.indexes) {
      await index.addDocument(document);
    }
  }

  public async addDocuments(documents: Document[]): Promise<void> {
    for (const index of this.indexes) {
      await index.addDocuments(documents);
    }
  }

  public async search(
    queryText: string,
    k = 1,
    kRrf = 60,
  ): Promise<SearchResult[]> {
    if (k <= 0) {
      throw new Error('k must be a positive integer.');
    }
    if (kRrf < 0) {
      throw new Error('kRrf must be non-negative.');
    }
    const allResults = await Promise.all(
      this.indexes.map((index) => index.search(queryText, k * 5)),
    );
    const docRanks = new Map<Document, DocRankEntry>();
    for (let idx = 0; idx < allResults.length; idx++) {
      const results = allResults[idx];
      for (let rank = 0; rank < results.length; rank++) {
        const [doc] = results[rank];
        if (!docRanks.has(doc)) {
          docRanks.set(doc, {
            docObj: doc,
            ranks: Array(this.indexes.length).fill(Infinity),
          });
        }
        docRanks.get(doc)!.ranks[idx] = rank + 1;
      }
    }
    const calcRrfScore = (ranks: number[]): number => {
      return ranks
        .filter((r) => r !== Infinity)
        .reduce((sum, r) => sum + 1.0 / (kRrf + r), 0);
    };
    const scoredDocs: SearchResult[] = Array.from(docRanks.values()).map(
      (entry) => [entry.docObj, calcRrfScore(entry.ranks)],
    );
    return scoredDocs
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, k);
  }
}

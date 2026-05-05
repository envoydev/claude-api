export interface Document {
  content: string;
  [key: string]: unknown;
}

export interface SearchIndex {
  addDocument(document: Document): void | Promise<void>;
  addDocuments(documents: Document[]): void | Promise<void>;
  search(query: string, k?: number): SearchResult[] | Promise<SearchResult[]>;
}

export interface DocRankEntry {
  docObj: Document;
  ranks: number[];
}

export type SearchResult = [Document, number];

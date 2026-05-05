import { Document, SearchIndex, SearchResult } from './store.types';

export class VectorIndex implements SearchIndex {
  private readonly distanceMetric: VectorDistanceMetric;
  private readonly embeddingFn: VectorEmbeddingFn | null;
  private vectors: number[][] = [];
  private documents: Document[] = [];
  private vectorDim: number | null = null;

  constructor(
    distanceMetric: VectorDistanceMetric = 'cosine',
    embeddingFn: VectorEmbeddingFn | null = null,
  ) {
    if (distanceMetric !== 'cosine' && distanceMetric !== 'euclidean') {
      throw new Error("distanceMetric must be 'cosine' or 'euclidean'");
    }
    this.distanceMetric = distanceMetric;
    this.embeddingFn = embeddingFn;
  }

  public get length(): number {
    return this.vectors.length;
  }

  public async addDocument(document: Document): Promise<void> {
    if (!this.embeddingFn) {
      throw new Error('Embedding function not provided during initialization.');
    }
    if (typeof document !== 'object' || document === null) {
      throw new TypeError('Document must be an object.');
    }
    if (!('content' in document)) {
      throw new Error("Document must contain a 'content' key.");
    }
    if (typeof document.content !== 'string') {
      throw new TypeError("Document 'content' must be a string.");
    }
    const vector = await this.embeddingFn(document.content);
    this.addVector(vector, document);
  }

  public async addDocuments(documents: Document[]): Promise<void> {
    for (const document of documents) {
      await this.addDocument(document);
    }
  }

  public async search(
    query: string | number[],
    k = 1,
  ): Promise<SearchResult[]> {
    if (this.vectors.length === 0) {
      return [];
    }
    let queryVector: number[];
    if (typeof query === 'string') {
      if (!this.embeddingFn) {
        throw new Error('Embedding function not provided for string query.');
      }
      queryVector = await this.embeddingFn(query);
    } else if (Array.isArray(query) && query.every((x) => Number.isFinite(x))) {
      queryVector = query;
    } else {
      throw new TypeError(
        'Query must be either a string or an array of numbers.',
      );
    }
    if (this.vectorDim === null) {
      return [];
    }
    if (queryVector.length !== this.vectorDim) {
      throw new Error(
        `Query vector dimension mismatch. Expected ${this.vectorDim}, got ${queryVector.length}`,
      );
    }
    if (k <= 0) {
      throw new Error('k must be a positive integer.');
    }
    const distFn =
      this.distanceMetric === 'cosine'
        ? this.cosineDistance.bind(this)
        : this.euclideanDistance.bind(this);
    const distances: [number, Document][] = this.vectors.map((stored, i) => [
      distFn(queryVector, stored),
      this.documents[i],
    ]);
    distances.sort(([a], [b]) => a - b);
    return distances.slice(0, k).map(([dist, doc]) => [doc, dist]);
  }

  public addVector(vector: number[], document: Document): void {
    if (!Array.isArray(vector) || !vector.every((x) => Number.isFinite(x))) {
      throw new TypeError('Vector must be an array of numbers.');
    }
    if (typeof document !== 'object' || document === null) {
      throw new TypeError('Document must be an object.');
    }
    if (!('content' in document)) {
      throw new Error("Document must contain a 'content' key.");
    }
    if (this.vectors.length === 0) {
      this.vectorDim = vector.length;
    } else {
      if (vector.length !== this.vectorDim) {
        throw new Error(
          `Inconsistent vector dimension. Expected ${this.vectorDim}, got ${vector.length}`,
        );
      }
    }
    this.vectors.push([...vector]);
    this.documents.push(document);
  }

  public toString(): string {
    return `VectorIndex(count=${this.length}, dim=${this.vectorDim}, metric='${this.distanceMetric}', has_embedding_fn='${this.embeddingFn ? 'Yes' : 'No'}')`;
  }

  private euclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimension');
    }
    return Math.sqrt(vec1.reduce((sum, v, i) => sum + (v - vec2[i]) ** 2, 0));
  }

  private cosineDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimension');
    }
    const mag1 = this.magnitude(vec1);
    const mag2 = this.magnitude(vec2);
    if (mag1 === 0 && mag2 === 0) {
      return 0.0;
    }
    if (mag1 === 0 || mag2 === 0) {
      return 1.0;
    }
    const similarity = Math.max(
      -1,
      Math.min(1, this.dotProduct(vec1, vec2) / (mag1 * mag2)),
    );
    return 1.0 - similarity;
  }

  private magnitude(vec: number[]): number {
    return Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  }

  private dotProduct(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimension');
    }
    return vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
  }
}

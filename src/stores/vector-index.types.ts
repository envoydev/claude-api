type VectorDistanceMetric = 'cosine' | 'euclidean';

type VectorEmbeddingFn = (text: string) => number[] | Promise<number[]>;

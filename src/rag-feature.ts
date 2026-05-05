import 'dotenv/config';
import path from 'path';
import { readFileSync } from 'fs';
import { chunkBySection } from './others/rag-tools';
import { VoyagerClient } from './voyager/voyager-client';
import { VectorIndex } from './stores/vector-index';
import { BM25Index } from './stores/bm-25-index';
import { Retriever } from './stores/retriever';

async function runVectorApproach(): Promise<void> {
  const voyagerClient = new VoyagerClient();
  const store = new VectorIndex();

  const text = readFileSync(
    path.join(__dirname, 'helpers/rag/report.md'),
    'utf-8',
  );
  const chunks = chunkBySection(text);
  const embeddings = await voyagerClient.generateEmbeddings(chunks);

  for (let i = 0; i < embeddings.length; i++) {
    store.addVector(embeddings[i], { content: chunks[i] });
  }

  const userEmbedding = await voyagerClient.generateEmbedding(
    'What did the software engineering dept do last year?',
  );
  const result = await store.search(userEmbedding, 2);

  console.log(result);
}

async function runBm25Approach(): Promise<void> {
  const store = new BM25Index();

  const text = readFileSync(
    path.join(__dirname, 'helpers/rag/report.md'),
    'utf-8',
  );
  const chunks = chunkBySection(text);

  for (let i = 0; i < chunks.length; i++) {
    store.addDocument({ content: chunks[i] });
  }

  const result = store.search('What happened with INC-2023-Q4-011?', 3);

  console.log(result);
}

async function combinedApproach() {
  const voyagerClient = new VoyagerClient();
  const vectorIndex = new VectorIndex('cosine', (text) =>
    voyagerClient.generateEmbedding(text),
  );
  const bm25Index = new BM25Index();
  const retriever = new Retriever(vectorIndex, bm25Index);

  const text = readFileSync(
    path.join(__dirname, 'helpers/rag/report.md'),
    'utf-8',
  );
  const chunks = chunkBySection(text);

  for (let i = 0; i < chunks.length; i++) {
    await retriever.addDocument({ content: chunks[i] });
  }

  const result = await retriever.search(
    'What happened with INC-2023-Q4-011?',
    3,
  );

  console.log(result);
}

// --- Entry point ---

async function main() {
  await runVectorApproach();
  await runBm25Approach();
  await combinedApproach();
}

main().catch(console.error);

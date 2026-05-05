// Chunk by a set number of characters
export function chunkByChar(
  text: string,
  chunkSize = 150,
  chunkOverlap = 20,
): string[] {
  const chunks: string[] = [];
  let startIdx = 0;
  while (startIdx < text.length) {
    const endIdx = Math.min(startIdx + chunkSize, text.length);
    chunks.push(text.slice(startIdx, endIdx));
    startIdx = endIdx < text.length ? endIdx - chunkOverlap : text.length;
  }
  return chunks;
}

// Chunk by sentence
export function chunkBySentence(
  text: string,
  maxSentencesPerChunk = 5,
  overlapSentences = 1,
): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let startIdx = 0;
  while (startIdx < sentences.length) {
    const endIdx = Math.min(startIdx + maxSentencesPerChunk, sentences.length);
    chunks.push(sentences.slice(startIdx, endIdx).join(' '));
    startIdx += maxSentencesPerChunk - overlapSentences;
    if (startIdx < 0) {
      startIdx = 0;
    }
  }
  return chunks;
}

// Chunk by section (splits on Markdown ## headers)
export function chunkBySection(documentText: string): string[] {
  return documentText.split(/\n## /);
}

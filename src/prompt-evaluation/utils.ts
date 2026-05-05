import path from 'path';

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function getFilePath(fileName: string, fileLocation?: string): string {
  return !!fileLocation ? path.join(fileLocation, fileName) : fileName;
}

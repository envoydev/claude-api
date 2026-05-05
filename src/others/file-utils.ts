import path from 'path';
import fs from 'fs';

export function loadImageAsBase64(imagePath: string): {
  data: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
} {
  const ext = path.extname(imagePath).toLowerCase();
  const mediaTypeMap: Record<
    string,
    'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  > = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  const mediaType = mediaTypeMap[ext];
  if (!mediaType) {
    throw new Error(`Unsupported image format: ${ext}`);
  }
  const data = fs.readFileSync(imagePath).toString('base64');
  return { data, mediaType };
}

export function loadFileAsBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64');
}

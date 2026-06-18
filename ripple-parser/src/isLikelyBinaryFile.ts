// Detects likely binary files by scanning the first bytes for null characters.
const BINARY_SAMPLE_BYTE_COUNT = 8192;

export function isLikelyBinaryFile(fileContents: Buffer): boolean {
  const sampleEnd = Math.min(fileContents.length, BINARY_SAMPLE_BYTE_COUNT);
  for (let index = 0; index < sampleEnd; index++) {
    if (fileContents[index] === 0) {
      return true;
    }
  }
  return false;
}

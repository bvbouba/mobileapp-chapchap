/** In-memory Saleor JWT for Apollo — only set after password login or biometric unlock. */
let memoryAuthToken: string | null = null;

export function setMemoryAuthToken(token: string | null): void {
  memoryAuthToken = token?.trim() ? token : null;
}

export function getMemoryAuthToken(): string | null {
  return memoryAuthToken;
}

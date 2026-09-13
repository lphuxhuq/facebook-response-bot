export class Deduplicator {
  private cache = new Map<string, number>();

  constructor(private readonly ttlMs: number = 300000) {} // 5 minutes default

  isDuplicate(key: string): boolean {
    const now = Date.now();
    const seenAt = this.cache.get(key);

    if (seenAt && now - seenAt < this.ttlMs) {
      return true;
    }

    this.cache.set(key, now);

    // Evict old keys if map exceeds 5000 items
    if (this.cache.size > 5000) {
      for (const [k, time] of this.cache.entries()) {
        if (now - time >= this.ttlMs) {
          this.cache.delete(k);
        }
      }
    }

    return false;
  }

  clear(): void {
    this.cache.clear();
  }
}

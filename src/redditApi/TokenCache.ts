export class TokenCache {
  private readonly cache: Map<string, { value: any; timeout: NodeJS.Timeout }> = new Map();

  public setWithTimeout(key: string, value: any, timeout: number): void {
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key).timeout);
    }

    const timeoutId = setTimeout(() => {
      this.cache.delete(key);
    }, timeout);

    this.cache.set(key, { value, timeout: timeoutId });
  }

  public get(key: string): any {
    const cachedValue = this.cache.get(key);
    if (cachedValue) {
      return cachedValue.value;
    }

    return undefined;
  }

  public delete(key: string): void {
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key).timeout);
      this.cache.delete(key);
    }
  }
}
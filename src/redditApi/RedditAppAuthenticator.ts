import axios from "axios";
import redditOptions from "./RedditOptions";

export class RedditAppAuthenticator  {
  private static readonly CacheKey = 'RedditAppToken';
  private readonly redditAppId: string;
  private readonly redditAppPassword: string;
  private cache: TokenCache;

  constructor() {
    this.redditAppId = redditOptions.redditAppId;
    this.redditAppPassword = redditOptions.redditAppPassword;
    this.cache = new TokenCache();
  }

  public async getAccessToken(): Promise<string> {
    let accessToken = await this.cache.get(RedditAppAuthenticator.CacheKey);
    if (!accessToken) {
      const request = {
        method: 'POST',
        url: 'https://www.reddit.com/api/v1/access_token',
        data: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'read',
        }),
      };
      
      const response = await axios.post(request.url, request.data, {auth: {username: this.redditAppId, password: this.redditAppPassword}});
      accessToken = response.data.access_token;
      this.cache.setWithTimeout(RedditAppAuthenticator.CacheKey, accessToken, 43200000); // Duration is 24hr, store in cache for half-life.
    }

    return accessToken;
  }
}
class TokenCache {
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


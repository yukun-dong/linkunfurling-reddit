import axios from "axios";
import { TokenCache } from "./TokenCache";
import { RedditOptions } from "./RedditOptions";

export class RedditAppAuthenticator  {
  private static readonly CacheKey = 'RedditAppToken';
  private readonly redditAppId: string;
  private readonly redditAppPassword: string;
  private cache: TokenCache;

  constructor(options: RedditOptions) {
    if (!options) {
      throw new Error('options cannot be null or undefined.');
    }
    this.redditAppId = options.redditAppId;
    this.redditAppPassword = options.redditAppPassword;
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
      this.cache.setWithTimeout(RedditAppAuthenticator.CacheKey, accessToken, 43200000);
    }

    return accessToken;
  }
}


### 1. create a reddit app

go to https://www.reddit.com/prefs/apps/ and register a new app for Reddit using the following parameters.

| Parameter        | Value                      |
|------------------|:---------------------------|
| Type       | `web app`                  |
| redirect uri | your redirect uri          |
| description      | Your own description       |
| about Url        | Url to your own about page |

save client id and secret for future use.

![reddit](reddit.png)

### 2. update manifest

update link unfurling domain to 
```json
  "domains": [
     "www.reddit.com",
      "reddit.com"
  ],
```

### 3. install package

npm install adaptivecards-templating

npm install axios

### 4. update env variables

- add reddit id and secret into .env.local and .env.local.user file:
  ```
  REDDIT_ID=<your reddit id>
  ```
  ```
  SECRET_REDDIT_PASSWORD=<your reddit secret>
  ```


### 5. update code
Add following code:
- src/redditApi/RedditAppAuthenticator.ts: the class to get Reddit api token
```ts
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
```
- src/redditApi/RedditHttpClient.ts: the class to call Reddit api 
```ts
import axios from "axios";
import { RedditAppAuthenticator } from "./RedditAppAuthenticator";

export class RedditHttpClient {
  private parameterExtractor = /https?:\/\/\w*\.?reddit\.com\/r\/(?<subreddit>\w+)\/comments\/(?<id>\w+)/;
  private redditAuthenticator: RedditAppAuthenticator;

  public constructor() {
    this.redditAuthenticator = new RedditAppAuthenticator();
  }
  public async GetLink(url: string) {
    const match = this.parameterExtractor.exec(url);
    if (match) {
      const { subreddit, id } = match.groups;
      const model = await this.GetLinkModel(subreddit, id);
      return model;
    }
  }

  private async GetLinkModel(subreddit: string, id: string) {
    const authToken = await this.redditAuthenticator.getAccessToken();
    const response = await axios.get(`https://oauth.reddit.com/r/${subreddit}/api/info?id=t3_${id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const firstPost = response.data.data.children[0].data;
    const model = {
      title: firstPost.title,
      id: firstPost.id,
      score: firstPost.score,
      subreddit: firstPost.subreddit,
      thumbnail: firstPost.preview?.images[0]?.source.url.replace(/&amp;/g, '&'),
      selfText: firstPost.selftext,
      numComments: firstPost.num_comments,
      link: "https://www.reddit.com" + firstPost.permalink,
      author: firstPost.author,
      created: new Date(firstPost.created_utc * 1000).toISOString(),
    }

    return model;
  }

}

```
- srcredditApi/RedditOptions.ts: define reddit id and password
```ts
const redditOptions = {
  redditAppId: process.env.REDDIT_ID,
  redditAppPassword: process.env.REDDIT_PASSWORD,
};

export default redditOptions;

```

Update following code:
- src/linkUnfurlingApp.ts:
```ts
import * as ACData from "adaptivecards-templating";
  public async handleTeamsAppBasedLinkQuery(
    context: TurnContext,
    query: AppBasedLinkQuery
  ): Promise<MessagingExtensionResponse> {
    // When the returned card is an adaptive card, the previewCard property of the attachment is required.
    const post = await this.redditClient.GetLink(query.url);
    const template = new ACData.Template(helloWorldCard);
    const adaptiveCard = template.expand({
      $root: {
        post: post,
      }
    });

    const previewCard = CardFactory.heroCard(post.title, post.subreddit, [post.thumbnail]);

    const attachment = { ...CardFactory.adaptiveCard(adaptiveCard), preview: previewCard };

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [attachment],
        suggestedActions: {
          actions: [
            {
              title: "default",
              type: "setCachePolicy",
              value: '{"type":"no-cache"}',
            },
          ],
        },
      },
    };
  }
  ```


### 6. local debug

hit F5 to start local debug, past a reddit link into chatbox and see the unfurled card
![link](link.png)
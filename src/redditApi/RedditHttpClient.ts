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

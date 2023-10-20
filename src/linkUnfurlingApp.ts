import {
  TeamsActivityHandler,
  CardFactory,
  TurnContext,
  MessagingExtensionResponse,
  AppBasedLinkQuery,
} from "botbuilder";
import helloWorldCard from "./adaptiveCards/helloWorldCard.json";
import { RedditHttpClient } from "./redditApi/RedditHttpClient";
import * as ACData from "adaptivecards-templating";
import { RedditOptions } from "./redditApi/RedditOptions";

export class LinkUnfurlingApp extends TeamsActivityHandler {
  private redditClient: RedditHttpClient;

  constructor(options: RedditOptions) {
    super();
    this.redditClient = new RedditHttpClient(options);
  }
  // Link Unfurling.
  // This function can be triggered after this app is installed.
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

  private RenderAdaptiveCard(post) {
    const titleBlock = {
      type: "TextBlock",
      text: `[${post.title}](${post.link})`,
      size: `Large`,
      wrap: true,
      maxLines: 2,
    };

    const upvoteColumn = {
      type: `Column`,
      width: `Auto`,
      items: [
        {
          type: "TextBlock",
          text: `↑ ${post.score}`,
        },
      ],
    };

    const commentColumn = {
      type: `Column`,
      width: `Auto`,
      items: [{
        type: "TextBlock",
        text: `🗨️ [${post.numComments}](https://www.reddit.com/r/${post.subreddit}/comments/${post.id})`,
      },
      ],
    };

    const subredditColumn = {
      type: `Column`,
      width: `Stretch`,
      items: [{
        type: "TextBlock",
        text: `/r/${post.subreddit}`,
        horizontalAlignment: `Right`,
        size: `Default`,
        weight: `Bolder`,
      },
      ],
    };

    const infoColumns = {
      type: `ColumnSet`,
      columns: [upvoteColumn, commentColumn, subredditColumn],
    };

    let preview;
    if (post.thumbnail != null) {
      preview = {
        type: `Image`,
        url: new URL(post.thumbnail),
        horizontalAlignment: `Center`,
        separator: true,
      };
    } else {
      preview = {
        type: `TextBlock`,
        text: post.selfText ?? 'Preview Not Available',
        wrap: true,
        separator: true,
      };
    }

    const bottomLeftColumn = {
      type: "Column",
      width: `Auto`,
      items: [{
        type: "TextBlock",
        text: `Posted by [/u/${post.author}](https://www.reddit.com/u/${post.author})`,
        size: `Small`,
        weight: `Lighter`,
      },
      ],
    };

    const createdText = `{{DATE(${post.created.toISOString()})}}`;
    const bottomRightColumn =

    {
      type: "Column",
      width: `Stretch`,
      items: [{
        type: "TextBlock",
        text: createdText,
        horizontalAlignment: `Right`,
        size: `Small`,
        weight: `Lighter`,
      },
      ],
    };

    const bottomColumns = {
      type: "ColumnSet",
      columns: [bottomLeftColumn, bottomRightColumn],
    };

    const card = {
      version: '1.6',
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      body: [titleBlock, infoColumns, preview, bottomColumns],
      actions: [{
        type: "Action.OpenUrl",
        title: 'Open in Reddit',
        url: post.link,
      },
      ],
    };

    return card;
  }

  // Zero Install Link Unfurling
  // This function can be triggered if this app sets "supportsAnonymizedPayloads": true in manifest and is uploaded to org's app catalog.
  public async handleTeamsAnonymousAppBasedLinkQuery(
    context: TurnContext,
    query: AppBasedLinkQuery
  ): Promise<MessagingExtensionResponse> {
    // When the returned card is an adaptive card, the previewCard property of the attachment is required.
    const previewCard = CardFactory.thumbnailCard("Preview Card", query.url, [
      "https://raw.githubusercontent.com/microsoft/botframework-sdk/master/icon.png",
    ]);

    const attachment = { ...CardFactory.adaptiveCard(helloWorldCard), preview: previewCard };

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
}

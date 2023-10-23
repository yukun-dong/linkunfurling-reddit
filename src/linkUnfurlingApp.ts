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

export class LinkUnfurlingApp extends TeamsActivityHandler {
  private redditClient: RedditHttpClient;

  constructor() {
    super();
    this.redditClient = new RedditHttpClient();
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

import { Tweet } from "../../tweet";
import {
  ArticleContentProps,
  ReacrElement,
  createInfoElement,
  getReactPropsKey,
} from "../utils";
import { sendRequest } from "../message";
import { getMessage } from "./i18n";
import { RouteComponent } from "../twitterRouting";

const checkedAttr = "twitter-ai-illustator-scanner-checked";

export const handleDefaultPage: RouteComponent = {
  onChangeContent: function () {
    const article = document.querySelector(`article:not([${checkedAttr}])`);

    if (article !== null) {
      article.setAttribute(checkedAttr, "");
      const tweet = getTweetInfo(article);

      if (tweet !== null) {
        const { entities } = tweet;

        if (entities.media !== undefined && entities.media.length > 0) {
          // is Image tweet
          handleTimelineTweet(tweet, article);
        }
      }
    }
  },
  onChangePage: function () {},
  onPurge: function () {},
};

async function handleTimelineTweet(tweet: Tweet, article: Element) {
  const result = await sendRequest("scanByTweet", {
    tweet,
  });

  if (result.score > 50) {
    const info = createInfoElement(
      getMessage("warn") + result.score,
      "#80163b",
      JSON.stringify(result, null, "<br>").slice(1, -1),
    );

    article.children[0].children[0].children[1].children[1].appendChild(info);
  }
}

function getTweetInfo(article: Element): Tweet | null {
  let result = null;

  const contentElem = article.children[0].children[0]
    .children[1] as ReacrElement<string, ArticleContentProps>;

  const key = getReactPropsKey(contentElem);
  const props: ArticleContentProps = contentElem[key];
  result =
    props.children.props.children[1].props.children[1][1].props.children[3]
      .props.children[2].props.tweet;
  console.log("Tweet:", result);
  return result;
}

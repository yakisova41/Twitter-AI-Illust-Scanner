import { Tweet } from "../../tweet";
import {
  ArticleContentProps,
  ReacrElement,
  createInfoElement,
  getReactPropsKey,
} from "../utils";
import { sendRequest } from "../message";

export function handleDefaultPage() {
  const foundAttr = "twitter-ai-illustator-scanner-checked";
  const article = document.querySelector(`article:not([${foundAttr}])`);

  if (article !== null) {
    article.setAttribute(foundAttr, "");
    const tweet = getTweetInfo(article);

    if (tweet !== null) {
      const { entities } = tweet;

      if (entities.media !== undefined && entities.media.length > 0) {
        // is Image tweet
        handleTimelineTweet(tweet, article);
      }
    }
  }
}

async function handleTimelineTweet(tweet: Tweet, article: Element) {
  const result = await sendRequest("scanByTweet", {
    tweet,
  });

  if (result.score > 50) {
    const info = createInfoElement(
      `このユーザーはAI絵師の可能性があります スコア:${result.score}`,
      "#80163b",
      JSON.stringify(result, null, "<br>"),
    );

    article.children[0].children[0].children[1].children[1].appendChild(info);
  }

  console.log(result);
}

function getTweetInfo(article: Element): Tweet | null {
  let result = null;

  const contentElem = article.children[0].children[0]
    .children[1] as ReacrElement<string, ArticleContentProps>;

  const key = getReactPropsKey(contentElem);
  const props: ArticleContentProps = contentElem[key];
  result =
    props.children.props.children._owner.memoizedProps.children[1][5].props
      .children[0].props.children.props.tweet;

  return result;
}

import { Tweet } from "src/tweet";
import { sendRequest } from "../message";
import {
  ArticleContentProps,
  ReacrElement,
  StatusArticleContentProps,
  createInfoElement,
  getReactPropsKey,
} from "../utils";

export async function handleStatusPage() {
  const foundAttr = "twitter-ai-judged";

  const mainArticle = document.querySelector(
    `article[tabindex="-1"]:not([${foundAttr}])`,
  );
  if (mainArticle !== null) {
    mainArticle.setAttribute(foundAttr, "");
    const tweet = getMainTweetInfo(mainArticle);

    if (tweet !== null) {
      const { entities } = tweet;

      if (entities.media !== undefined && entities.media.length > 0) {
        handleTimelineMainTweet(tweet, mainArticle);
      }
    }
  }

  const article = document.querySelector(
    `article[tabindex="0"]:not([${foundAttr}])`,
  );
  if (article !== null) {
    article.setAttribute(foundAttr, "");
    const tweet = getTweetInfo(article);

    if (tweet !== null) {
      const { entities } = tweet;

      if (entities.media !== undefined && entities.media.length > 0) {
        handleTimelineReplyTweet(tweet, article);
      }
    }
  }
}

async function handleTimelineMainTweet(tweet: Tweet, article: Element) {
  const result = await sendRequest("scanByTweet", {
    tweet,
  });

  if (result.score > 50) {
    const info = createInfoElement(
      `このユーザーはAI絵師の可能性があります スコア:${result.score}`,
      "#80163b",
      JSON.stringify(result, null, "<br>"),
    );

    article.children[0].children[0].appendChild(info);
  }

  console.log(result);
}

async function handleTimelineReplyTweet(tweet: Tweet, article: Element) {
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

function getMainTweetInfo(article: Element): Tweet | null {
  let result = null;

  const contentElem = article.children[0].children[0] as ReacrElement<
    string,
    StatusArticleContentProps
  >;

  const key = getReactPropsKey(contentElem);
  const props: StatusArticleContentProps = contentElem[key];
  result = props.children[0][2].props.children[7].props.tweet;

  return result;
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

import { Tweet } from "src/tweet";
import { sendRequest } from "../message";
import {
  ArticleContentProps,
  ReacrElement,
  StatusArticleContentProps,
  createInfoElement,
  getReactPropsKey,
} from "../utils";
import { getMessage } from "./i18n";
import { RouteComponent } from "../twitterRouting";

const judgedAttr = "twitter-ai-judged";

export const handleStatusPage: RouteComponent = {
  onChangeContent: function () {
    const article = document.querySelector(
      `article[tabindex="0"]:not([${judgedAttr}])`,
    );
    if (article !== null) {
      article.setAttribute(judgedAttr, "");
      const tweet = getTweetInfo(article);

      if (tweet !== null) {
        const { entities } = tweet;

        if (entities.media !== undefined && entities.media.length > 0) {
          handleTimelineReplyTweet(tweet, article);
        }
      }
    }
  },
  onChangePage: function () {
    const mainArticle = document.querySelector(
      `article[tabindex="-1"]:not([${judgedAttr}])`,
    );
    if (mainArticle !== null) {
      mainArticle.setAttribute(judgedAttr, "");
      const tweet = getMainTweetInfo(mainArticle);

      if (tweet !== null) {
        const { entities } = tweet;

        if (entities.media !== undefined && entities.media.length > 0) {
          handleTimelineMainTweet(tweet, mainArticle);
        }
      }
    }
  },
  onPurge: function () {},
};

async function handleTimelineMainTweet(tweet: Tweet, article: Element) {
  const result = await sendRequest("scanByTweet", {
    tweet,
  });

  if (result.score > 50) {
    const info = createInfoElement(
      getMessage("warn") + result.score,
      "#80163b",
      JSON.stringify(result, null, "<br>"),
    );

    article.children[0].children[0].appendChild(info);
  }

}

async function handleTimelineReplyTweet(tweet: Tweet, article: Element) {
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

  console.log(
    "[Twitter AI Illust Scanner]<Status Judge Result> ",
    tweet.permalink,
    result,
  );
}

function getMainTweetInfo(article: Element): Tweet | null {
  let result = null;

  const contentElem = article.children[0].children[0] as ReacrElement<
    string,
    StatusArticleContentProps
  >;

  const key = getReactPropsKey(contentElem);
  const props: StatusArticleContentProps = contentElem[key];

  result = props.children[0][2]?.props?.children[9]?.props?.tweet;

  if (result === undefined) {
    return null;
  }

  return result;
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

  return result;
}

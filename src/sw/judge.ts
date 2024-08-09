import {
  TwitterOpenApi,
  type TweetApiUtilsData,
  TwitterOpenApiClient,
} from "twitter-openapi-typescript";
import {
  CursorType,
  CursorTypeToJSON,
  type User,
} from "twitter-openapi-typescript-generated";

const AIWORDS = [
  "人工智能",
  "人工知能",
  "出力",
  "[sS][dD]" /*sd */,
  "[nN][aA][iI]" /*nai */,
  "[Mm][iI][dD][jJ][oO][uU][rR][nN][eE][yY]" /*Midjourney */,
  "[dD][aA][lL][lL][eE]" /* DALLE */,
  "[Dd]iffusion" /* ~ diffusion */,
  "(?=.*niji)(?=.*journey)" /* nijijourney */,
  "プロンプト",
  "[pP]rompt",
  "𝒜𝐼",
  "[aA][iI][aA]rt",
  "生成",
  "(?<![a-zA-Z])[aA][iI](?![a-zA-Z])",
  "AIGC",
  "[gG]enera(te|tion|ted)",
  "呪文",
  "(?<![a-zA-Z])Kei(?<![a-zA-Z])" /* Kei is prompt creator */,
];
const aiReg = `${AIWORDS.join("|")}`;

const HUMANWORDS = [
  "スマホ",
  "手書き",
  "練習",
  "(?<!AI)(お絵)描[かきくけこ]",
  "を描[かきくけこい]",
  "落書き",
  "(?<!元|AI|お)絵描き",
  "下手",
  "(?=.*AI)(?=.*禁止)",
  "(?=.*AI)(?=.*🚫)",
  "成人済み",
];
const humanReg = `${HUMANWORDS.join("|")}`;

const scoreList = {
  isIncludeWordOfAIinProfile: 60,
  isIncludeWordOfHumaninProfile: -60,

  intervalAvgMinADay: 20,
  intervalAvgMinHalfDay: 50,

  imgProportionMax50Percent: 5,
  imgProportionMax70Percent: 10,
  imgProportionMax90Percent: 20,
  imgProportionMax95Percent: 40,

  favoriteScoreMinOneTenth: 20,
  favoriteScoreMin20th: 30,

  isIncludedAIInTags: 50,
};

export interface JudgeResult {
  score: number;
  intervalAvg: number;
  imgProportion: number;
  isIncludeWordOfAIinProfile: boolean;
  isIncludeWordOfHumaninProfile: boolean;
  isIncludedAIInTags: boolean;
}

export async function judge(
  userName: string,
  client: TwitterOpenApiClient,
): Promise<JudgeResult> {
  let score = 0;

  const twResonse = await client
    .getUserApi()
    .getUserByScreenName({ screenName: userName });

  const userData = twResonse.data.user;

  if (userData === undefined) {
    throw new Error("User did not existed");
  }

  const userId = userData.restId;

  const isIncludeWordOfAIinProfile = getIsIncludeWordOfAIinProfile(
    userData,
    userName,
  );
  const isIncludeWordOfHumaninProfile = getIsIncludeWordOfHumaninProfile(
    userData,
    userName,
  );

  const tweetsResponse = await client
    .getTweetApi()
    .getUserTweets({ userId: userId, count: 20 });

  const { intervalAvg, imgProportion, favoriteAvg, isIncludedAIInTags } =
    analyzeTweets(tweetsResponse.data.data);

  if (isIncludeWordOfAIinProfile) {
    score = score + scoreList["isIncludeWordOfAIinProfile"];
  }

  if (isIncludeWordOfHumaninProfile) {
    score = score + scoreList["isIncludeWordOfHumaninProfile"];
  }

  if (intervalAvg < 0.5) {
    score = score + scoreList["intervalAvgMinHalfDay"];
  } else if (intervalAvg < 1) {
    score = score + scoreList["intervalAvgMinADay"];
  }

  if (imgProportion > 0.95) {
    score = score + scoreList["imgProportionMax95Percent"];
  } else if (intervalAvg > 0.9) {
    score = score + scoreList["imgProportionMax90Percent"];
  } else if (intervalAvg > 0.7) {
    score = score + scoreList["imgProportionMax70Percent"];
  } else if (intervalAvg > 0.5) {
    score = score + scoreList["imgProportionMax50Percent"];
  }

  /*
  const favoriteScore = favoriteAvg / userData.legacy.followersCount;

  if (favoriteScore < 0.05) {
    score = score + scoreList["favoriteScoreMin20th"];
  } else if (favoriteScore < 0.1) {
    score = score + scoreList["favoriteScoreMinOneTenth"];
  }
  */

  if (isIncludedAIInTags) {
    score = score + scoreList["isIncludedAIInTags"];
  }

  return {
    isIncludedAIInTags,
    score,
    intervalAvg,
    imgProportion,
    isIncludeWordOfAIinProfile,
    isIncludeWordOfHumaninProfile,
    //favoriteScore: favoriteAvg / userData.legacy.followersCount,
  };
}

/**
 * Is AI word is included in Description, name, and location.
 * @param userData
 * @returns
 */
function getIsIncludeWordOfAIinProfile(userData: User, userName: string) {
  const { description, location, name } = userData.legacy;

  if (
    location.match(aiReg) ||
    description.match(aiReg) ||
    name.match(aiReg) ||
    userName.match(aiReg)
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Is HUMAN word is included in Description, name, and location.
 * @param userData
 * @returns
 */
function getIsIncludeWordOfHumaninProfile(userData: User, userName: string) {
  const { description, location, name } = userData.legacy;

  if (
    location.match(humanReg) ||
    description.match(humanReg) ||
    name.match(humanReg) ||
    userName.match(humanReg)
  ) {
    return true;
  } else {
    return false;
  }
}

interface ImgTweet {
  createdAtDate: Date;
  favoriteCount: number;
  retweetCount: number;
}

function analyzeTweets(tweets: TweetApiUtilsData[]) {
  const imgTweetsFromWebApp: ImgTweet[] = [];

  let isIncludedAIInTags = false;

  tweets.forEach((tweet) => {
    const { entities, createdAt, favoriteCount, retweetCount } =
      tweet.tweet.legacy!;

    if (entities.media !== undefined && tweet.tweet.source !== undefined) {
      // media tweet

      if (
        tweet.tweet.source ===
        '<a href="https://mobile.twitter.com" rel="nofollow">Twitter Web App</a>'
      ) {
        // From webapp tweet
        isIncludedAIInTags =
          entities.hashtags.filter(({ text }) => {
            return text.match(aiReg);
          }).length !== 0;

        const createdAtDate = new Date(createdAt);
        imgTweetsFromWebApp.push({
          createdAtDate,
          favoriteCount,
          retweetCount,
        });
      }
    } else {
      // not media tweet
    }
  });

  /**
   * Percentage of image tweets from Twitter Web App in 100 tweets
   */
  const imgProportion = imgTweetsFromWebApp.length / tweets.length;

  /**
   * Get interval of img tweet from Twitter Web App
   */
  const sortedTweets = imgTweetsFromWebApp.sort(
    (x, y) => x.createdAtDate.getTime() - y.createdAtDate.getTime(),
  );

  const tweetCount = 50;
  //const letestTweets = sortedTweets.splice(sortedTweets.length - (tweetCount - 1),  tweetCount);
  const letestTweets = sortedTweets;

  let beforeD: Date | null = null;
  let totalD = 0;
  let totalFavorite = 0;

  letestTweets.forEach((tweet) => {
    if (beforeD !== null) {
      const diff = tweet.createdAtDate.getTime() - beforeD.getTime();
      const diffDay = diff / (24 * 60 * 60 * 1000);
      totalD = totalD + diffDay;
    }
    beforeD = tweet.createdAtDate;

    totalFavorite = totalFavorite + tweet.favoriteCount;
  });

  const intervalAvg = totalD / letestTweets.length;
  const favoriteAvg = totalFavorite / letestTweets.length;

  return {
    intervalAvg,
    imgProportion,
    favoriteAvg,
    isIncludedAIInTags,
  };
}

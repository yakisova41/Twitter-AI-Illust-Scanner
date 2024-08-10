import { Tweet, User } from "src/tweet";
import {
  TweetApiUtilsData,
  TwitterOpenApiClient,
} from "twitter-openapi-typescript";
import { type User as OpenAPIUser } from "twitter-openapi-typescript-generated";

export class Scanner {
  static AIWORDS = [
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
  private aiRegex = `${Scanner.AIWORDS.join("|")}`;

  static HUMANWORDS = [
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
  private humanRegex = `${Scanner.HUMANWORDS.join("|")}`;

  static scoreRule: ScoreRule = {
    isIncludeWordAboutAIinProfile: [["=", true, 60]],
    isIncludeWordAboutHumaninProfile: [["=", true, -60]],
    intervalAvg: [
      ["<", 1, 50],
      ["<", 0.5, 20],
    ],
    imgProportion: [
      [">", 0.95, 40],
      [">", 0.9, 20],
      [">", 0.7, 10],
      [">", 0.5, 5],
    ],
    isIncludeWordAboutAI: [["=", true, 50]],
  };

  private readonly client: TwitterOpenApiClient;

  private score = 0;

  constructor(client: TwitterOpenApiClient) {
    this.client = client;
  }

  /**
   * Scan from data what can be get from React props in Twitter Web App.
   * @param tweet
   */
  public async scanByUserTweet(tweet: Tweet): Promise<ScanResult> {
    return this.scan(tweet.user, tweet.user.id_str);
  }

  /**
   * Scan from data what can be get from screenName
   * @param tweet
   */
  public async scanByScreenName(screenName: string): Promise<ScanResult> {
    const userResponse = await this.client
      .getUserApi()
      .getUserByScreenName({ screenName: screenName });

    const userData = userResponse.data.user;

    if (userData === undefined) {
      throw new Error("User did not existed");
    }

    const legacy = this.legacyToSnake(userData.legacy);

    const userId = userData.restId;

    return this.scan(legacy, userId);
  }

  private async scan(user: User, userId: string) {
    const { intervalAvg, isIncludeWordAboutAI, imgProportion } =
      await this.scanTweets(userId);
    const isIncludeWordAboutAIinProfile =
      this.scanIsIncludeWordAboutAIinProfile(user);

    const isIncludeWordAboutHumaninProfile =
      this.scanIsIncludeWordAboutHumaninProfile(user);

    this.setScore("imgProportion", imgProportion);
    this.setScore("intervalAvg", intervalAvg);
    this.setScore("isIncludeWordAboutAI", isIncludeWordAboutAI);
    this.setScore(
      "isIncludeWordAboutAIinProfile",
      isIncludeWordAboutAIinProfile,
    );
    this.setScore(
      "isIncludeWordAboutHumaninProfile",
      isIncludeWordAboutHumaninProfile,
    );

    return {
      isIncludeWordAboutAI,
      score: this.score,
      intervalAvg,
      imgProportion,
      isIncludeWordAboutAIinProfile,
      isIncludeWordAboutHumaninProfile,
    };
  }

  private setScore(name: keyof ScoreRule, value: any) {
    const rules = Scanner.scoreRule[name];

    for (let i = 0; i < rules.length; i++) {
      const [mode, threshold, score] = rules[i];

      if (mode === "=") {
        if (value === threshold) {
          this.score += score;
          break;
        }
      }

      if (mode === ">") {
        if (value > threshold) {
          this.score += score;
          break;
        }
      }

      if (mode === "<") {
        if (value < threshold) {
          this.score += score;
          break;
        }
      }
    }
  }

  private legacyToSnake(lecacy: OpenAPIUser["legacy"]) {
    return Object.fromEntries(
      Object.entries(lecacy).map(([key, value]) => [
        key.replace(/([A-Z])/g, "_$1").toLowerCase(),
        value,
      ]),
    ) as User;
  }

  /**
   * Is the word about AI is included in Description, name, and location.
   * e.g. AI/SD/generated...
   * @param userData
   * @returns
   */
  private scanIsIncludeWordAboutAIinProfile(userData: User) {
    const { description, location, name, screen_name } = userData;

    if (
      location.match(this.aiRegex) ||
      description.match(this.aiRegex) ||
      name.match(this.aiRegex) ||
      screen_name.match(this.aiRegex)
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Is the word about Human is included in Description, name, and location.
   * e.g. 落書き/お絵かき...
   * @param userData
   * @returns
   */
  private scanIsIncludeWordAboutHumaninProfile(userData: User) {
    const { description, location, name, screen_name } = userData;

    if (
      location.match(this.humanRegex) ||
      description.match(this.humanRegex) ||
      name.match(this.humanRegex) ||
      screen_name.match(this.humanRegex)
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Scan tweets what can be get from API.
   * @param userId
   * @returns
   */
  private async scanTweets(userId: string): Promise<TweetsScanResult> {
    // Is tags of tweet included the words about AI?
    let isIncludeWordAboutAI = false;

    const { tweets, imgProportion } = await this.getTweetsWithMedia(userId);

    let totalInterval = 0;

    for (let i = 0; i < tweets.length; i++) {
      const current = tweets[i];

      // Get Diff
      if (i !== 0) {
        const previous = tweets[i - 1];

        const diffInMs = current.date.getTime() - previous.date.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        totalInterval += diffInDays;
      }

      // Search AI in Tag
      isIncludeWordAboutAI =
        current.tweet.entities.hashtags.filter(({ text }) => {
          return text.match(this.aiRegex);
        }).length !== 0;

      isIncludeWordAboutAI =
        current.tweet.fullText.match(this.aiRegex) !== null;
    }

    const intervalAvg = totalInterval === 0 ? 0 : totalInterval / tweets.length;

    return {
      intervalAvg,
      isIncludeWordAboutAI,
      imgProportion,
    };
  }

  /**
   * Get Tweets with media had posted from Web app.
   * @param userId
   * @returns
   */
  private async getTweetsWithMedia(
    userId: string,
  ): Promise<GetTweetsWithMediaResult> {
    const tweetsWithMediaFromWebAPPANDDATE: TweetWithMediaFromWebAPP_AND_DATE[] =
      [];

    const tweetsResponse = await this.client
      .getTweetApi()
      .getUserTweets({ userId: userId, count: 20 });

    const tweets = tweetsResponse.data.data;

    tweets.forEach((tweet) => {
      const { entities, createdAt } = tweet.tweet.legacy!;

      // is with media
      if (entities.media !== undefined && tweet.tweet.source !== undefined) {
        // is from webapp
        if (
          tweet.tweet.source ===
          '<a href="https://mobile.twitter.com" rel="nofollow">Twitter Web App</a>'
        ) {
          if (tweet.tweet.legacy !== undefined) {
            const date = new Date(createdAt);
            tweetsWithMediaFromWebAPPANDDATE.push({
              tweet: tweet.tweet.legacy,
              date,
            });
          }
        }
      }
    });

    /**
     * Percentage of image tweets from Twitter Web App in 100 tweets
     */
    const imgProportion =
      tweetsWithMediaFromWebAPPANDDATE.length === 0
        ? 0
        : tweetsWithMediaFromWebAPPANDDATE.length / tweets.length;

    /**
     * Sort latest
     */
    const sortedTweets = tweetsWithMediaFromWebAPPANDDATE.sort((x, y) => {
      return x.date.getTime() - y.date.getTime();
    });

    return { tweets: sortedTweets, imgProportion };
  }
}

interface GetTweetsWithMediaResult {
  tweets: TweetWithMediaFromWebAPP_AND_DATE[];
  imgProportion: number;
}

export interface ScanResult {
  isIncludeWordAboutAI: boolean;
  score: number;
  intervalAvg: number;
  imgProportion: number;
  isIncludeWordAboutAIinProfile: boolean;
  isIncludeWordAboutHumaninProfile: boolean;
}

type TweetWithMediaFromWebAPP = Exclude<
  TweetApiUtilsData["tweet"]["legacy"],
  undefined
>;

interface TweetWithMediaFromWebAPP_AND_DATE {
  tweet: TweetWithMediaFromWebAPP;
  date: Date;
}

interface TweetsScanResult {
  intervalAvg: number;
  isIncludeWordAboutAI: boolean;
  imgProportion: number;
}

export type ScoreRuleThreshold = any;
export type ScoreRuleScore = number;
export type ScoreRuleMode = "=" | ">" | "<";

export type ScoreRule = Record<
  string,
  [ScoreRuleMode, ScoreRuleThreshold, ScoreRuleScore][]
>;

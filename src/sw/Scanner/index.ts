import { Tweet, User } from "src/tweet";
import {
  TimelineApiUtilsResponse,
  TweetApiUtilsData,
  TwitterApiUtilsResponse,
  TwitterOpenApi,
  TwitterOpenApiClient,
  UserApiUtilsData,
} from "twitter-openapi-typescript";
import { type User as OpenAPIUser } from "twitter-openapi-typescript-generated";

export class Scanner {
  static AIWORDS = [
    "術師",
    "人工智能",
    "人工知能",
    "出力",
    "[sS]\\s?[dD]" /*sd */,
    "[nN]\\s?[aA]\\s?[iI]" /*nai */,
    "[Mm]\\s?[iI]\\s?[dD]\\s?[jJ]\\s?[oO]\\s?[uU]\\s?[rR]\\s?[nN]\\s?[eE]\\s?[yY]" /*Midjourney */,
    "[dD]\\s?[aA]\\s?[lL]\\s?[lL]\\s?[eE]" /* DALLE */,
    "[Dd]\\s?i\\s?f\\s?f\\s?u\\s?s\\s?i\\s?o\\s?n" /* ~ diffusion */,
    "(?=.*[nN]iji)(?=.*[jJ]ourney)" /* nijijourney */,
    "[ニに]]\\s?[じジ]]\\s?[じジ]]\\s?[ゃャ]]\\s?ー]\\s?[ニに]ー",
    "[pP]\\s?i\\s?x\\s?a\\s?i",
    "プロンプト",
    "[pP]rompt",
    "𝒜𝐼",
    "[aA][iI][aA]rt",
    "生成",
    "(?<![a-zA-Z])[aA][iI](?![a-zA-Z])",
    "AIGC",
    "[gG]enera(te|tion|ted)",
    "呪文",
    "術師",
    "加筆修正",
  ];
  private aiRegex = new RegExp(`${Scanner.AIWORDS.join("|")}`);

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
    "(?=.*AI)(?=.*ご遠慮)",
    "成人済み",
    "^(?!.*respect).*draw.*",
  ];
  private humanRegex = new RegExp(`${Scanner.HUMANWORDS.join("|")}`);

  static scoreRule: ScoreRule = {
    isIncludeWordAboutAIinProfile: [["=", true, 60]],
    isIncludeWordAboutHumaninProfile: [["=", true, -60]],
    intervalAvg: [
      ["=", null, 0],
      ["<", 1, 50],
      ["<", 0.5, 20],
    ],
    imgProportion: [
      [">", 0.95, 40],
      [">", 0.9, 20],
      [">", 0.7, 10],
      [">", 0.5, 5],
    ],
    isIncludeWordAboutAI: [["=", true, 70]],
  };

  private client: TwitterOpenApiClient;

  private score = 0;

  /**
   * Debug & Benchmark mode;
   */
  private debug = true;

  constructor(client: TwitterOpenApiClient) {
    this.client = client;

    if (this.debug) {
      console.log("AI regex", this.aiRegex.source);
      console.log("Human regex", this.humanRegex.source);
    }
  }

  /**
   * Scan from data what can be get from React props in Twitter Web App.
   * @param tweet
   */
  public async scanByUserTweet(tweet: Tweet): Promise<ScanResult> {
    if (this.debug) {
      console.time("scanByUserTweet()");
    }

    const scanResult = this.scan(tweet.user, tweet.user.id_str);

    if (this.debug) {
      console.timeEnd("scanByUserTweet()");
    }

    return scanResult;
  }

  /**
   * Scan from data what can be get from screenName
   * @param tweet
   */
  public async scanByScreenName(screenName: string): Promise<ScanResult> {
    const userResponse = await this.getUserByScreenName(screenName);

    if (userResponse === null) {
      throw new Error();
    }

    const userData = userResponse.data.user;

    if (userData === undefined) {
      throw new Error("User did not existed");
    }

    const legacy = this.legacyToSnake(userData.legacy);

    const userId = userData.restId;

    if (this.debug) {
      console.time("scanByScreenName()");
    }

    const scanResult = this.scan(legacy, userId);

    if (this.debug) {
      console.timeEnd("scanByScreenName()");
    }

    return scanResult;
  }

  private async scan(user: User, userId: string): Promise<ScanResult> {
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

    const date = new Date();

    return {
      isIncludeWordAboutAI,
      score: this.score,
      intervalAvg,
      imgProportion,
      isIncludeWordAboutAIinProfile,
      isIncludeWordAboutHumaninProfile,
      scanDate: date.getTime(),
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
      this.aiRegex.test(
        location + " " + description + " " + screen_name + " " + name,
      )
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
      this.humanRegex.test(
        location + " " + description + " " + screen_name + " " + name,
      )
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
      let tags = "";

      for (let i = 0; i < current.tweet.entities.hashtags.length; i++) {
        tags += " " + current.tweet.entities.hashtags[i].text;
      }

      isIncludeWordAboutAI = this.aiRegex.test(tags);

      isIncludeWordAboutAI = this.aiRegex.test(current.tweet.fullText);
    }

    /**
     * When it failed to get tweets, declare total interval as null and attempt to rescan on next scan request.
     */
    const intervalAvg =
      totalInterval === 0 ? null : totalInterval / tweets.length;

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

    const tweetsResponse = await this.getUserTweets(userId);

    if (tweetsResponse === null) {
      throw new Error("");
    }

    const tweets = tweetsResponse.data.data;

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];

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
    }

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

  private async getUserByScreenName(
    screenName: string,
  ): Promise<null | TwitterApiUtilsResponse<UserApiUtilsData>> {
    const get = () => {
      return this.client
        .getUserApi()
        .getUserByScreenName({ screenName: screenName });
    };

    return new Promise((r) => {
      get()
        .then((e) => {
          r(e);
        })
        .catch(async (e) => {
          await this.renewClient();
          r(await get());
        });
    });
  }

  private async getUserTweets(
    userId: string,
  ): Promise<null | TwitterApiUtilsResponse<
    TimelineApiUtilsResponse<TweetApiUtilsData>
  >> {
    const get = () => {
      return this.client
        .getTweetApi()
        .getUserTweets({ userId: userId, count: 20 });
    };

    return new Promise((r) => {
      get()
        .then((e) => {
          r(e);
        })
        .catch(async (e) => {
          await this.renewClient();
          r(await get());
        });
    });
  }

  private async renewClient() {
    const api = new TwitterOpenApi();
    this.client = await api.getGuestClient();
  }
}

interface GetTweetsWithMediaResult {
  tweets: TweetWithMediaFromWebAPP_AND_DATE[];
  imgProportion: number;
}

export interface ScanResult {
  isIncludeWordAboutAI: boolean;
  score: number;
  intervalAvg: number | null;
  imgProportion: number;
  isIncludeWordAboutAIinProfile: boolean;
  isIncludeWordAboutHumaninProfile: boolean;
  scanDate: number;
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
  intervalAvg: number | null;
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

import {
  TwitterOpenApi,
  TwitterOpenApiClient,
} from "twitter-openapi-typescript";
import { niceFetch } from "./niceFetch";
import {
  AIScannerMsgRequest,
  AIScannerMsgResponse,
} from "src/contentScripts/message";
import { ScanResult, Scanner } from "./Scanner";

TwitterOpenApi.twitter = "https://x.com/";
TwitterOpenApi.fetchApi = niceFetch;

let client: null | TwitterOpenApiClient = null;

// Clear judge caches when updated extension.
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason == "update") {
    await chrome.storage.local.clear();
  }

  if (client === null) {
    const api = new TwitterOpenApi();
    client = await api.getGuestClient();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  if (client === null) {
    const api = new TwitterOpenApi();
    client = await api.getGuestClient();
  }
});

chrome.runtime.onMessage.addListener(
  (request: AIScannerMsgRequest, sender, sendResponse) => {
    switch (request.requestName) {
      case "scanByTweet":
        handleScanByTweetRequest(
          request as AIScannerMsgRequest<"scanByTweet">,
          sender,
        );
        break;
      case "scanByScreenName":
        handleScanByScreenName(
          request as AIScannerMsgRequest<"scanByScreenName">,
          sender,
        );
        break;
    }
  },
);

/**
 * Running on judge by tweet requested
 * @param request
 * @param sender
 */
async function handleScanByTweetRequest(
  request: AIScannerMsgRequest<"scanByTweet">,
  sender: chrome.runtime.MessageSender,
) {
  const cache = await getCache(request.value.tweet.user.screen_name);

  if (cache === null) {
    console.log(
      `Handle Scan By Tweet Request, screen name: ${request.value.tweet.user.screen_name}`,
    );

    if (client === null) {
      // Setup client when client is null
      const api = new TwitterOpenApi();
      client = await api.getGuestClient();
    }

    const scanner = new Scanner(client);
    const scanResult = await scanner.scanByUserTweet(request.value.tweet);

    setCache(request.value.tweet.user.screen_name, scanResult);

    sendResponse(
      {
        requestName: "scanByTweet",
        messageId: request.messageId,
        value: scanResult,
      },
      sender,
    );
  } else {
    console.log(
      `[USE CACHE] Handle Scan By Tweet Request, screen name: ${request.value.tweet.user.screen_name}`,
      cache,
    );

    sendResponse(
      {
        requestName: "scanByTweet",
        messageId: request.messageId,
        value: cache,
      },
      sender,
    );
  }
}

/**
 * Running on judge by screen name requested
 * @param request
 * @param sender
 */
async function handleScanByScreenName(
  request: AIScannerMsgRequest<"scanByScreenName">,
  sender: chrome.runtime.MessageSender,
) {
  const cache = await getCache(request.value.screenName);

  if (cache === null) {
    console.log(
      `Handle Scan By ScreenName, screen name: ${request.value.screenName}`,
    );

    if (client === null) {
      // Setup client when client is null
      const api = new TwitterOpenApi();
      client = await api.getGuestClient();
    }

    const scanner = new Scanner(client);
    const scanResult = await scanner.scanByScreenName(request.value.screenName);

    setCache(request.value.screenName, scanResult);

    sendResponse(
      {
        requestName: "scanByScreenName",
        messageId: request.messageId,
        value: scanResult,
      },
      sender,
    );
  } else {
    console.log(
      `[USE CACHE] Handle Scan By ScreenName, screen name: ${request.value.screenName}`,
      cache,
    );

    sendResponse(
      {
        requestName: "scanByTweet",
        messageId: request.messageId,
        value: cache,
      },
      sender,
    );
  }
}

/**
 * Send message response to content script.
 * @param value
 * @param sender
 */
async function sendResponse<T extends AIScannerMsgResponse>(
  value: T,
  sender: chrome.runtime.MessageSender,
) {
  await chrome.tabs.sendMessage<T>(sender.tab!.id!, value);
}

/**
 * Set the judge result to storage.
 * @param user
 * @param data
 */
export async function setCache(user: string, data: ScanResult) {
  await chrome.storage.local.set({
    [user]: data,
  });
}

/**
 * Get all judge results from storage.
 * @param user
 * @returns
 */
export async function getCache(user: string): Promise<null | ScanResult> {
  const res = await chrome.storage.local.get(user);
  if (res[user] === undefined) {
    return null;
  } else {
    return res[user];
  }
}

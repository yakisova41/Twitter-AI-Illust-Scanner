import {
  TwitterOpenApi,
  TwitterOpenApiClient,
} from "twitter-openapi-typescript";
import { JudgeResult, judge } from "./judge";
import { niceFetch } from "./niceFetch";

TwitterOpenApi.twitter = "https://x.com/";
TwitterOpenApi.fetchApi = niceFetch;

let client: null | TwitterOpenApiClient = null;

chrome.runtime.onStartup.addListener(async () => {
  if (client !== null) {
    const api = new TwitterOpenApi();
    client = await api.getGuestClient();
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason == "update") {
    await chrome.storage.local.clear();
  }

  if (client !== null) {
    const api = new TwitterOpenApi();
    client = await api.getGuestClient();
  }
});

type JudgeCallback = (result: JudgeResult) => void;
const judgingUsers: Record<string, JudgeCallback[]> = {};

chrome.runtime.onMessage.addListener(
  (request: UserGetReq, sender, sendResponse) => {
    let name = request.user;
    if (request.user[0] === "@") {
      name = request.user.substring(1);
    }

    const clientNotNull = (client: TwitterOpenApiClient) => {
      if (judgingUsers[name] !== undefined) {
        judgingUsers[name].push((data) => {
          chrome.tabs.sendMessage<MessageResponse>(sender.tab!.id!, {
            ...data,
            id: request.id,
          });
        });
      } else {
        judgingUsers[name] = [];

        judge(name, client).then((data) => {
          judgingUsers[name].forEach((callback) => {
            callback(data);
          });

          delete judgingUsers[name];

          chrome.tabs.sendMessage<MessageResponse>(sender.tab!.id!, {
            ...data,
            id: request.id,
          });
        });
      }
    };

    if (client !== null) {
      clientNotNull(client);
    } else {
      const api = new TwitterOpenApi();
      api.getGuestClient().then((c) => {
        client = c;
        clientNotNull(client);
      });
    }
  },
);

export interface UserGetReq {
  user: string;
  id: string;
}

export interface MessageResponse extends JudgeResult {
  id: string;
}

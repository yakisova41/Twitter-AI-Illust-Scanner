import { bypassSendMessage } from "crx-monkey";
import { AIScannerMsgRequest, sendRequest } from "../message";

let messages: Record<string, string> = {};

export async function setupi18n() {
  const messageKeys = ["warn", "detail"];

  await Promise.all(
    messageKeys.map(async (key) => {
      await bypassSendMessage<AIScannerMsgRequest<"i18n">>(
        {
          requestName: "i18n",
          value: {
            messageName: key,
          },
          messageId: "",
        },
        {},
        (res: string) => {
          messages[key] = res;
        },
      );
    }),
  );
}

export function getMessage(messageName: string) {
  return messages[messageName];
}

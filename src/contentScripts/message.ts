import { message } from "crx-monkey-next/client";
import { ScanResult } from "src/sw/Scanner";
import { Tweet } from "src/tweet";

export function sendRequest<T extends keyof AIScannerRequestValues>(
  requestName: T,
  value: AIScannerRequestValues[T],
): Promise<AIScannerResponseValues[T]> {
  return new Promise(async (resolve) => {
    const messageId = crypto.randomUUID();

    message.sendMessage<AIScannerMsgRequest<T>>({
      requestName,
      value,
      messageId,
    });

    const listener = message.addListener<AIScannerMsgResponse<T>>((request) => {
      if (request.messageId === messageId) {
        const { value } = request;
        listener.remove();
        resolve(value);
      }
    });
  });
}

export interface AIScannerRequestValues {
  scanByTweet: {
    tweet: Tweet;
  };
  scanByScreenName: {
    screenName: string;
  };
  i18n: {
    messageName: string;
  };
}

export interface AIScannerResponseValues {
  scanByTweet: ScanResult;
  scanByScreenName: ScanResult;
  i18n: string;
}

export interface AIScannerMsgRequest<
  T extends keyof AIScannerRequestValues = keyof AIScannerRequestValues,
> {
  requestName: T;
  messageId: string;
  value: AIScannerRequestValues[T];
}

export interface AIScannerMsgResponse<
  T extends keyof AIScannerResponseValues = keyof AIScannerResponseValues,
> {
  requestName: T;
  messageId: string;
  value: AIScannerResponseValues[T];
}

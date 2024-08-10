import { bypassMessage, bypassSendMessage } from "crx-monkey";
import { ScanResult } from "src/sw/Scanner";
import { Tweet } from "src/tweet";

export function sendRequest<T extends keyof AIScannerRequestValues>(
  requestName: T,
  value: AIScannerRequestValues[T],
): Promise<AIScannerResponseValues[T]> {
  return new Promise(async (resolve) => {
    const messageId = crypto.randomUUID();

    bypassSendMessage<AIScannerMsgRequest<T>>({
      requestName,
      value,
      messageId,
    });

    const listener = bypassMessage<AIScannerMsgResponse<T>>((request) => {
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
}

export interface AIScannerResponseValues {
  scanByTweet: ScanResult;
  scanByScreenName: ScanResult;
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

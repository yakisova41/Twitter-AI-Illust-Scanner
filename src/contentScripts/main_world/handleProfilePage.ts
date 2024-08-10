import { sendRequest } from "../message";
import { createInfoElement } from "../utils";

let previousUser: null | string = null;
let previousInfo: null | Element = null;

export async function handleProfilePage() {
  const foundAttr = "twitter-ai-judged";

  const userNameElem = document.querySelector(
    `div[data-testid="UserName"] > div:nth-child(1) >  div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div[dir="ltr"] > span:not([${foundAttr}])`,
  );

  const screenName = location.pathname.substring(1);

  if (userNameElem !== null) {
    userNameElem.setAttribute(foundAttr, "");
  }

  if (userNameElem !== null || previousUser !== screenName) {
    if (previousInfo !== null) {
      previousInfo.remove();
    }

    previousUser = screenName;

    /**
     * Append delay because removing all cookie in x.com temporarily when using api.
     */
    setTimeout(async () => {
      const infoParent = document.querySelector(
        'div[data-testid="UserName"] > div:nth-child(1) > div:nth-child(1)',
      )!;

      const result = await sendRequest("scanByScreenName", {
        screenName,
      });

      if (result.score > 50) {
        const info = createInfoElement(
          `このユーザーはAI絵師の可能性があります スコア:${result.score}`,
          "#80163b",
          JSON.stringify(result, null, "<br>"),
        );

        infoParent.appendChild(info);

        previousInfo = info;
      }

      console.log(screenName, result);
    }, 100);
  }
}

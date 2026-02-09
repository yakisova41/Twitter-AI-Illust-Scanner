import { sendRequest } from "../message";
import { RouteComponent } from "../twitterRouting";
import { createInfoElement, getElement } from "../utils";
import { getMessage } from "./i18n";

const judgedAttr = "twitter-ai-judged";

let previousName = "";
let previousInfo: null | Element = null;

export const handleProfilePage: RouteComponent = {
  onChangeContent: function () {
    const screenName = location.pathname.substring(1);

    if (screenName !== previousName) {
      if (previousInfo !== null) {
        previousInfo.remove();
      }
      judgeProfile(screenName);
      previousName = screenName;
    }
  },
  onChangePage: function () {

    const userNameElem = document.querySelector(
      `div[data-testid="UserName"] div[dir="ltr"] > span:not([${judgedAttr}])`,
    );
    if (userNameElem !== null) {
      userNameElem.setAttribute(judgedAttr, "");
      const screenName = location.pathname.substring(1);
      judgeProfile(screenName);
      previousName = screenName;
    }
  },
  onPurge: function () {},
};

function judgeProfile(screenName: string) {
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
        getMessage("warn") + result.score,
        "#80163b",
        JSON.stringify(result, null, "<br>").slice(1, -1),
      );
      previousInfo = info;
      infoParent.appendChild(info);
    }

    console.log(
      "[Twitter AI Illust Scanner]<Profile Judge Result> ",
      screenName,
      result,
    );
  }, 100);
}

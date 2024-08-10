import { routing } from "../twitterRouting";
import { getElement } from "../utils";
import { handleDefaultPage } from "./handleDefaultPage";
import { handleProfilePage } from "./handleProfilePage";
import { handleStatusPage } from "./handleStatusPage";

const mainObserver = new MutationObserver(() => {
  routing({
    default: [handleDefaultPage],
    status: [handleStatusPage],
    profile: [handleProfilePage, handleDefaultPage],
  });
});

getElement("main").then((main) => {
  mainObserver.observe(main, {
    subtree: true,
    childList: true,
    characterData: true,
  });
});
import { Router } from "../twitterRouting";
import { getElement } from "../utils";
import { handleDefaultPage } from "./handleDefaultPage";
import { handleProfilePage } from "./handleProfilePage";
import { handleStatusPage } from "./handleStatusPage";
import { setupi18n } from "./i18n";

(async () => {

  await setupi18n();
  const router = new Router();
  router.routes = {
    default: [handleDefaultPage],
    status: [handleStatusPage],
    profile: [handleProfilePage, handleDefaultPage],
  };
  const mainObserver = new MutationObserver(() => {
    router.route();
  });

  getElement("main").then((main) => {
    mainObserver.observe(main, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });
})();

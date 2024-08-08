import { MessageResponse, UserGetReq } from "src/sw/sw";
import { getElement, getReactFiberKey, getUsernameFromTwElem } from "./utils";

function createInfo(
  article: Element,
  text: string,
  color: string = "rgb(59 123 68)",
  popup?: string,
) {
  const info = document.createElement("div");
  info.innerHTML = `<span>${text}</span>`;
  info.style.padding = "15px 10px";
  info.style.background = color;
  info.style.color = "#e8f6ff";
  info.style.borderRadius = "8px";
  info.style.marginTop = "10px";

  if (popup !== undefined) {
    const toggle = document.createElement("span");
    const popupContent = document.createElement("p");
    popupContent.textContent = popup;
    popupContent.style.display = "none";
    toggle.textContent = "  ▼  詳細";
    let isOpen = false;

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      if (isOpen) {
        isOpen = false;
        toggle.textContent = "  ▼  詳細";
        popupContent.style.display = "none";
      } else {
        isOpen = true;
        toggle.textContent = "  ▲  詳細";
        popupContent.style.display = "block";
      }
    });

    info.appendChild(toggle);
    info.append(popupContent);
  }

  article
    .querySelector(
      "div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)",
    )!
    .appendChild(info);

  return info;
}

function onNewArticle(article: Element) {
  setTimeout(async () => {
    const isImage =
      article.querySelector('div[data-testid="tweetPhoto"] img') !== null;

    if (isImage) {
      const userName = getUsernameFromTwElem(article);
      const id = crypto.randomUUID();

      const cache = await getCache(userName);

      if (cache !== null) {
        if (cache.score > 50) {
          createInfo(
            article,
            `このユーザーはAI絵師の可能性があります スコア:${cache.score}`,
            "#80163b",
            JSON.stringify(cache, null, 2),
          );
        } else {
        }
      } else {
        chrome.runtime.sendMessage<UserGetReq>({
          user: userName,
          id,
        });

        const onMessage = (
          message: MessageResponse,
          sender: chrome.runtime.MessageSender,
        ) => {
          const res: MessageResponse = message;

          if (res.id === id) {
            const isAI = res.score > 50;

            setCache(userName, res);

            if (isAI) {
              createInfo(
                article,
                `このユーザーはAI絵師の可能性があります スコア:${res.score}`,
                "#80163b",
                JSON.stringify(res, null, 2),
              );
            } else {
            }

            chrome.runtime.onMessage.removeListener(onMessage);
          }
        };

        chrome.runtime.onMessage.addListener(onMessage);
      }
    }
  }, 100);
}

async function setCache(user: string, data: MessageResponse) {
  await chrome.storage.local.set({
    [user]: data,
  });
}

async function getCache(user: string): Promise<null | MessageResponse> {
  const res = await chrome.storage.local.get(user);
  if (res[user] === undefined) {
    return null;
  } else {
    return res[user];
  }
}

const mainObserver = new MutationObserver(() => {
  const foundAttr = "twitter-ai-judged";
  const article = document.querySelector(`article:not([${foundAttr}])`);

  if (article !== null) {
    article.setAttribute("twitter-ai-judged", "");
    onNewArticle(article);
  }
});

getElement("main").then((main) => {
  mainObserver.observe(main, {
    subtree: true,
    childList: true,
    characterData: true,
  });
});

import { Tweet } from "src/tweet";

/**
 * Search element from parent element (default is body).
 * @param selector
 * @param parent
 * @returns
 */
export function getElement<T extends Element>(
  selector: string,
  parent: Element = document.body,
): Promise<T> {
  return new Promise((resolve, reject) => {
    setInterval(() => {
      const e = parent.querySelector<T>(selector);
      if (e !== null) {
        resolve(e);
      }
    }, 400);

    setTimeout(() => {
      reject(new Error("Timeout"));
    }, 4000);
  });
}

/**
 * Get screen name from a Tweet element.
 * @param elem
 * @returns
 */
export function getUsernameFromTwElem(elem: Element) {
  const span = elem.querySelector(
    'div[data-testid="User-Name"] > div:nth-child(2) > div >  div:nth-child(1) span',
  );
  if (span !== null) {
    let name = span.textContent === null ? "" : span.textContent;
    if (name[0] === "@") {
      name = name.substring(1);
    }
    return name;
  } else {
    return "";
  }
}

/**
 * Get key of React Props from Element propertys.
 * @param elem
 * @returns
 */
export function getReactPropsKey(elem: ReacrElement<any, any>) {
  const reactPropsKey = Object.keys(elem).filter((key) => {
    return key.match(/^__reactProps\$/);
  })[0];

  if (reactPropsKey === undefined) {
    throw new Error("Key does not found");
  }

  return reactPropsKey as keyof ReacrElement<typeof reactPropsKey, any>;
}

/**
 * Create info box to a Tweet Element in Timeline.
 * @param article
 * @param text
 * @param color
 * @param popup
 * @returns
 */
export function createInfoElement(
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
    popupContent.innerHTML = popup;
    popupContent.style.wordBreak = "break-all";
    popupContent.style.display = "none";
    popupContent.style.fontFamily = "TwitterChirp";

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
    info.appendChild(popupContent);
  }

  return info;
}

export type ReacrElement<T extends string, P extends any> = Element & {
  [key in T]: P;
};

export interface ArticleContentProps {
  children: {
    props: {
      children: {
        _owner: {
          memoizedProps: {
            children: [
              [],
              [
                null,
                null,
                null,
                null,
                null,
                {
                  props: {
                    children: [
                      {
                        props: {
                          children: {
                            props: {
                              tweet: Tweet;
                            };
                          };
                        };
                      },
                    ];
                  };
                },
              ],
            ];
          };
        };
      };
    };
  };
}

export interface StatusArticleContentProps {
  children: [
    [
      {},
      {},
      {
        props: {
          children: [
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {
              props: {
                tweet: Tweet;
              };
            },
          ];
        };
      },
    ],
  ];
}
type a = StatusArticleContentProps["children"][0][2];

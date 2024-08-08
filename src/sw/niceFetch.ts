/**
 * クッキーを空の状態にしてからFetch後元のクッキーに戻す。
 * @param input
 * @param init
 * @returns
 */
export async function niceFetch(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
): Promise<Response> {
  const req = getReq(input);
  const url = new URL(req.href);

  let newHeaders: Record<string, any> = {
    ...req.headers,
  };

  let newInit = init;

  if (newInit !== undefined) {
    const { headers } = newInit;

    if (headers !== undefined) {
      newHeaders = headers;
    }
  }

  const originalCookies = await chrome.cookies.getAll({
    url: req.href,
  });

  const originalCookiesCp = structuredClone(originalCookies);

  await Promise.all(
    originalCookies.map(({ name }) => {
      chrome.cookies.remove({
        name,
        url: req.href,
      });
    }),
  );

  const res = await fetch(req.href, newInit);

  await Promise.all(
    originalCookiesCp.map(
      ({
        value,
        storeId,
        domain,
        sameSite,
        secure,
        name,
        path,
        expirationDate,
        httpOnly,
      }) => {
        chrome.cookies.set({
          name,
          url: req.href,
          path,
          expirationDate,
          httpOnly,
          secure,
          sameSite,
          domain,
          storeId,
          value,
        });
      },
    ),
  );

  return res;
}

function getReq(input: RequestInfo | URL) {
  let headers: Record<string, any> = {};
  let href: string = "";

  if (input instanceof Request) {
    headers = input.headers;
    href = input.url;
  } else if (input instanceof URL) {
    href = input.href;
  } else {
    href = input;
  }

  return {
    headers,
    href,
  };
}

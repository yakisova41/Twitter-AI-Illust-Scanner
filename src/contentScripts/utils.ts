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

export function getReactFiberKey(elem: Element) {
  const reactFiberKey = Object.keys(elem).map((key) => {
    if (key.match(/^__reactFiber\$/)) {
      return key;
    }
  })[0];

  return reactFiberKey;
}

export function routing(routes: Routes) {
  const name = getPageName();
  const callbacks = routes[name];

  if (callbacks !== undefined) {
    callbacks.forEach((c) => {
      c();
    });
  }
}

function getPageName() {
  let name: RouteNames = "default";

  if (
    document.querySelector('div[data-testid="UserProfileHeader_Items"]') !==
    null
  )
    name = "profile";

  if (
    document.querySelector(`h2[dir="ltr"]:not(#modal-header) > span`) !== null
  )
    name = "status";

  if (document.querySelector(`div[data-testid="mask"]`) !== null)
    name = "status-photo";

  return name;
}

export type RouteNames = "status" | "status-photo" | "profile" | "default";

export type Routes = {
  [key in RouteNames]?: (() => any)[];
};

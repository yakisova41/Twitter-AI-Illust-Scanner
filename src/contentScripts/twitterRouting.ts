export class Router {
  public routes!: Routes;
  private previousName:
    | "status"
    | "status-photo"
    | "profile"
    | "default"
    | null = null;

  public async route() {
    const name = getPageName();

    if (this.previousName !== name) {
      // Page change
    //  console.log(`[Router] page changed ${this.previousName} -> ${name}`);

      if (this.previousName !== null) {
        this.routes[this.previousName]?.forEach((route) => {
          route.onPurge();
        });
      //  console.log("[Router] Purged");
      }

      if (this.routes[name] !== undefined) {
        this.routes[name].forEach((route) => {
          if (route !== undefined) {
            route.onChangePage();
          }
        });
      }
    } else {
   //   console.log("[Router] content changed");
      if (this.routes[name] !== undefined) {
        this.routes[name].forEach((route) => {
          route.onChangeContent();
        });
      }
    }

    this.previousName = name;
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
  [key in RouteNames]?: RouteComponent[];
};

export type RouteComponent = {
  onChangeContent: () => any;
  onChangePage: () => any;
  onPurge: () => any;
};

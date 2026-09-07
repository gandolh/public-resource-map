export class LocalStorage {
  static get<T>(key: string) {
    // Storage can be absent (prerender) or throw (Safari private mode, blocked
    // site data). A missing preference is a working state, not an error.
    if (typeof window === "undefined") return undefined;
    let item: string | null = null;
    try {
      item = window.localStorage.getItem(key);
    } catch {
      return undefined;
    }
    if (!item) {
      return undefined;
    }

    try {
      const parsedItem = JSON.parse(item) as unknown;
      return parsedItem as T;
    } catch {
      return item as T;
    }
  }

  static set<
    T extends
      | Record<string, unknown>
      | null
      | undefined
      | number
      | string
      | Array<any>
  >(key: string, value: T) {
    if (value === null || value === undefined) {
      return;
    }

    let lsValue = JSON.stringify(value);

    if (typeof value === "string") {
      lsValue = value;
    }

    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, lsValue);
    } catch {
      /* quota or blocked storage — the preference just does not persist */
    }
  }

  static has(key: string) {
    return window.localStorage.getItem(key) !== null;
  }

  static clear() {
    window.localStorage.clear();
  }

  static remove(key: string) {
    if (window.localStorage.getItem(key)) {
      window.localStorage.removeItem(key);
    }
  }
}

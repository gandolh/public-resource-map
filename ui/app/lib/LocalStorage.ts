export class LocalStorage {
  static get<T>(key: string) {
    const item = window.localStorage.getItem(key);
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

    window.localStorage.setItem(key, lsValue);
  }

  static has(key: string) {
    const item = window.localStorage.get(key);

    return !!item;
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

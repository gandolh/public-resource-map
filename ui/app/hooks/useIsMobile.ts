import { useEffect, useState } from "react";

/**
 * Matches the `md` breakpoint the layout uses. A media query rather than a
 * width check so it tracks orientation changes without a resize listener.
 */
export function useIsMobile(query = "(max-width: 767px)"): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

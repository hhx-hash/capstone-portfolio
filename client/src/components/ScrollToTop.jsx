import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * A single page application keeps the scroll position across route changes,
 * which lands a reader halfway down a new page. This resets it on every
 * navigation, except when the change is a same-page hash link.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [pathname, hash]);

  return null;
}

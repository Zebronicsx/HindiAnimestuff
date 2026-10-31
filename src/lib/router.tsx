import { useCallback, useEffect, useState } from "react";

export interface Route {
  seg: string[];
  raw: string;
}

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const pathOnly = h.split("?")[0];
  const seg = pathOnly.split("/").filter(Boolean).map(decodeURIComponent);
  return { seg, raw: pathOnly };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  return route;
}

export function navigate(to: string, replace = false) {
  const target = to.startsWith("/") ? `#${to}` : `#/${to}`;
  if (replace) window.location.replace(target);
  else window.location.hash = to.startsWith("/") ? `#${to}` : `#/${to}`;
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), []);
}

export const href = (to: string) => `#${to.startsWith("/") ? to : `/${to}`}`;

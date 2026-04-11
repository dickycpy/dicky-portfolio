import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use requestAnimationFrame to ensure the scroll happens after the browser has finished rendering
    const scroll = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant" as ScrollBehavior,
      });
      // Fallback for some browsers or specific layout structures
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    };

    scroll();
    // Second attempt after a tiny delay to catch any late-rendering content
    const timeoutId = setTimeout(scroll, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

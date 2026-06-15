import { createBrowserRouter } from "react-router-dom";

import Landing from "./routes/Landing";

// Footer routes share one lazy placeholder Page (code-split).
const lazyPage = async () => ({ Component: (await import("./routes/Page")).default });

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  {
    path: "/catalog",
    lazy: async () => ({ Component: (await import("./routes/Catalog")).default }),
  },
  { path: "/faqs", lazy: lazyPage },
  { path: "/testimonios", lazy: lazyPage },
  { path: "/privacidad", lazy: lazyPage },
  { path: "/terminos", lazy: lazyPage },
]);

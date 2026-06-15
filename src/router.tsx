import { createBrowserRouter } from "react-router-dom";

import Landing from "./routes/Landing";

// Lazy, code-split routes.
const lazyPage = async () => ({ Component: (await import("./routes/Page")).default });
const lazyLegal = async () => ({ Component: (await import("./routes/Legal")).default });

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  {
    path: "/catalog",
    lazy: async () => ({ Component: (await import("./routes/Catalog")).default }),
  },
  { path: "/faqs", lazy: lazyPage },
  { path: "/testimonios", lazy: lazyPage },
  { path: "/privacidad", lazy: lazyLegal },
  { path: "/terminos", lazy: lazyLegal },
]);

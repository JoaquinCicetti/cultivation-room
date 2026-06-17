import { createBrowserRouter } from "react-router-dom";

import Landing from "./routes/Landing";

// Lazy, code-split routes.
const lazyLegal = async () => ({ Component: (await import("./routes/Legal")).default });

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  {
    path: "/catalog",
    lazy: async () => ({ Component: (await import("./routes/Catalog")).default }),
  },
  { path: "/faqs", lazy: async () => ({ Component: (await import("./routes/Faqs")).default }) },
  { path: "/testimonios", lazy: async () => ({ Component: (await import("./routes/Testimonials")).default }) },
  { path: "/privacidad", lazy: lazyLegal },
  { path: "/terminos", lazy: lazyLegal },
]);

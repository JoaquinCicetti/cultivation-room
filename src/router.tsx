import { createBrowserRouter } from "react-router-dom";

import Landing from "./routes/Landing";

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  {
    path: "/catalog",
    // Code-split: the catalog ships as its own chunk, loaded on navigation.
    lazy: async () => ({ Component: (await import("./routes/Catalog")).default }),
  },
]);

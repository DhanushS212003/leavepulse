import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { routes } from "./routes";
import "./index.css";

const router = createBrowserRouter(routes);

const root = document.getElementById("root");

if (!root) {
  throw new Error('Root element "#root" not found');
}

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);

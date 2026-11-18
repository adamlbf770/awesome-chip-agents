import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { parsePage, type Page } from "./model";
import { initAnalytics } from "./analytics";
import "./style.css";

const element = document.getElementById("root")!;
const serialized = document.getElementById("page-data");
const page: Page = serialized
  ? JSON.parse(serialized.textContent!)
  : parsePage(location.pathname);
const app = <App page={page} />;
if (serialized) hydrateRoot(element, app);
else createRoot(element).render(app);
initAnalytics();

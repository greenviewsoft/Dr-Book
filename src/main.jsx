import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@appwrite.io/pink-icons";
import { I18nProvider } from "@/i18n/I18nContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <I18nProvider>
          <App />
        </I18nProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);

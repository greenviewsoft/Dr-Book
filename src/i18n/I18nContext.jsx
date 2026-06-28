import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { dictionaries } from "./dictionaries";

const I18nContext = createContext(null);
const STORAGE_KEY = "app.lang";

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "bn"
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // t("path.to.key", { var: value }) — falls back to bn, then to the key itself
  const t = useCallback(
    (key, vars) => {
      const resolve = (dict) => {
        let val = dict;
        for (const part of key.split(".")) {
          val = val?.[part];
          if (val === undefined) return undefined;
        }
        return val;
      };
      let str =
        resolve(dictionaries[lang]) ??
        resolve(dictionaries.bn) ??
        key;
      if (typeof str === "string" && vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, v);
        }
      }
      return str;
    },
    [lang]
  );

  const toggle = useCallback(
    () => setLang((l) => (l === "bn" ? "en" : "bn")),
    []
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

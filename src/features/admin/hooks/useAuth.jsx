import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { account } from "@/lib/appwrite";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    account
      .get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession("current");
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

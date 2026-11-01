import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { api, tokenStorage } from "../lib/api.js";

/**
 * Owns the authentication state for the whole app.
 *
 * The token is the source of truth. The user object is never trusted from
 * localStorage: on every reload it is re-fetched from `/api/users/me`, so an
 * expired session logs itself out instead of rendering a logged-in shell with
 * no working requests behind it.
 */
export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStorage.get()));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    api
      .me()
      .then((account) => {
        if (!cancelled) setUser(account);
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const applySession = useCallback((session) => {
    tokenStorage.set(session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const session = await api.login({ email, password });
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const register = useCallback(
    async ({ username, email, password }) => {
      const session = await api.register({ username, email, password });
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [token, user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

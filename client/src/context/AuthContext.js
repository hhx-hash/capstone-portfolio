import { createContext, useContext } from "react";

/**
 * Session state lives here: the token, the account behind it, and the three
 * functions that change them. The default is `null` on purpose - the hook below
 * turns "used outside the provider" into a clear error instead of a confusing
 * `undefined` somewhere deep in a component.
 */
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}

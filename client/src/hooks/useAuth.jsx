import { createContext, useContext, useEffect, useState } from "react";
import { register, login } from "@/api/auth";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local storage session on mount
    const loadSession = () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setSession({ access_token: token });
        } catch (error) {
          console.warn("Failed to parse stored user:", error);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      const data = await register({ name: fullName, email, password });

      const mappedUser = {
        id: data._id,
        email: data.email,
        user_metadata: {
          full_name: data.name,
        },
        role: data.role || "user",
      };

      localStorage.setItem("user", JSON.stringify(mappedUser));
      localStorage.setItem("token", data.token);

      setUser(mappedUser);
      setSession({ access_token: data.token });

      return { error: null };
    } catch (err) {
      console.error("SignUp error:", err);
      const message = err.response?.data?.message || err.message || "Signup failed. Please try again.";
      return { error: new Error(message) };
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await login({ email, password });

      const mappedUser = {
        id: data._id,
        email: data.email,
        user_metadata: {
          full_name: data.name,
        },
        role: data.role || "user",
      };

      localStorage.setItem("user", JSON.stringify(mappedUser));
      localStorage.setItem("token", data.token);

      setUser(mappedUser);
      setSession({ access_token: data.token });

      return { error: null };
    } catch (err) {
      console.error("SignIn error:", err);
      const message = err.response?.data?.message || err.message || "Signin failed. Check credentials.";
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

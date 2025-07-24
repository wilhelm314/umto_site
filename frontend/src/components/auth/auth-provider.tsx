// context/auth-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { readUsersMe, loginForAccessToken, logout as _logout } from "../../api/index";
import { useRouter, useSearchParams } from "next/navigation";

import { User, AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check auth status on initial load

    useEffect(() => {
        async function loadUser() {
            setLoading(true);
            try {
                // First try to get user with current token
                const response = await readUsersMe();

                if (response.data) {
                    // Success - we have a valid user
                    setUser(response.data as User);
                } else {
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            // First attempt to login with credentials
            await loginForAccessToken({
                body: {
                    username,
                    password,
                },
            });

            // If login was successful, fetch the user data
            try {
                const userResponse = await readUsersMe();
                setUser(userResponse.data as User);
            } catch (userError) {
                console.error("Failed to fetch user after login:", userError);
                setUser(null);
            }
        } catch (loginError) {
            console.error("Login failed:", loginError);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await _logout();
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };
    // Memoize the context value to prevent unnecessary renders
    const contextValue = useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
            isAdmin: user?.user_type === "admin",
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

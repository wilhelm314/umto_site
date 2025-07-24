"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { readUsersMe, loginForAccessToken, logout } from "../../api/index";
import { useRouter } from "next/navigation";

export type User = {
    id: number;
    full_name: string;
    email: string;
    user_type: string;
    // Add other user properties as needed
};

export const AuthContext = createContext<{
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => void;
    logout: () => void;
    isAdmin: boolean;
}>({
    user: null,
    loading: false,
    login: (username: string, password: string) => { },
    logout: () => { },
    isAdmin: false,
});

export const useAuthContext = () => useContext(AuthContext);

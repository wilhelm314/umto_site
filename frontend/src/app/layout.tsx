"use client";

import "./globals.css";
import Navbar from "@/components/navbar/navbar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Suspense } from "react";
import { useAuthContext } from "@/components/auth/auth-context";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head></head>

            <body className={`antialiased bg-white `}>
                <Suspense>
                    <AuthProvider>
                        <div className="w-full">
                            <Navbar />
                            <div className="">{children}</div>
                        </div>
                    </AuthProvider>
                </Suspense>
            </body>
        </html>
    );
}

"use client"

import { useAuthContext } from "@/components/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function SignIn() {
    const { login, loading, user } = useAuthContext();
    const { push } = useRouter()


    useEffect(() => {
        if (user) {
            push("/")
        }
    }, [user])

    // the auth provider handles navigation on succesfull login:)
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault(); // stops page from reloading

        try {
            login(username, password);
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <div className="h-screen w-full">
            <div className="flex flex-row w-full h-full justify-center">
                <div className="h-full w-fit flex flex-col justify-center">
                    <div>
                        <div className="p-2 shadow-md rounded-lg max-w-md w-full">
                            <p className="hsub mb-1 underline">Sign into your account</p>
                            <div className="mb-6">
                                <p className="b text-black my-2">Fill in your username and password to sign in</p>

                                <form onSubmit={handleSubmit} className="space-y-2">
                                    <div>
                                        <label htmlFor="username" className="l text-black mb-1">
                                            Email
                                        </label>
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-2 py-1 border border-black rounded-md bg-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="l text-black mb-1">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-2 py-1 border border-black rounded-md bg-white"
                                            required
                                        />
                                    </div>

                                    <div className=" flex flex-row justify-center">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className=" p-1 rounded-lg l text-black hover:bg-gray border border-black "
                                        >
                                            {loading ? "Signing in..." : "Sign in"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

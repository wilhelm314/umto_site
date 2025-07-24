"use client";

import React, { useEffect, useState } from "react";
import "./navbar.css";
import { useAuthContext, User } from "../auth/auth-context";
import { useRouter } from "next/navigation";

const Navbar = () => {
    const { user, isAdmin } = useAuthContext();

    const { push } = useRouter();

    const [fouldout, setFouldout] = useState(false);

    type navpath = {
        path: string;
        name: string;
    };

    const navlink = (val: navpath) => {
        return (
            <div key={val.path} className="flex flex-col h-full justify-center text-black">
                <div onClick={() => push(val.path)} className="group hover:cursor-pointer">
                    <p className="l group-hover:underline">{val.name}</p>
                </div>
            </div>
        );
    };

    return (
        <nav className="z-10 w-full flex-shrink-0 bg-white h-4 shadow-sm select-none">
            <div className="w-full h-full grid grid-cols-5  px-2 py-1">
                <div className="flex flex-row justify-start">
                    <div className="flex flex-col justify-center     w-fit h-full">
                        <p className="h2">JAAW</p>
                    </div>
                </div>
                <div className="flex flex-row justify-between col-span-3 w-full">
                    {isAdmin
                        ? [
                            { path: "/dashboard/agents", name: "Agents" },
                            { path: "/dashboard/groups", name: "Groups" },
                            { path: "/dashboard/users", name: "Users" },
                            { path: "/dashboard/artifacts", name: "Artifacts" },
                            { path: "/chat", name: "Chat" },
                        ].map((x) => {
                            return navlink(x);
                        })
                        : ""}
                </div>
                <div className="w-full flex flex-row justify-end">
                    <div className="flex flex-col h-full justify-center mx-1">
                        {user ? (
                            <div onClick={() => push("/signout")} className="group hover:cursor-pointer ">
                                <p className="l group-hover:underline ">Sign out</p>
                            </div>
                        ) : (
                            <div onClick={() => push("/signin")} className="group hover:cursor-pointer ">
                                <p className="l group-hover:underline ">Sign in</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-row justify-end justify-self-end">
                    <div className="hidden flex flex-col justify-center h-full w-fit">
                        <div
                            onClick={() => setFouldout((p) => !p)}
                            className={`dre-navigation-menu-icon ${fouldout ? "dre-navigation-menu-icon--expanded" : ""}`}
                        >
                            <span
                                className={`dre-navigation-menu-icon__line ${fouldout ? "dre-navigation-menu-icon__line--expanded" : ""}`}
                            ></span>
                            <span
                                className={`dre-navigation-menu-icon__line ${fouldout ? "dre-navigation-menu-icon__line--expanded" : ""}`}
                            ></span>
                            <span
                                className={`dre-navigation-menu-icon__line ${fouldout ? "dre-navigation-menu-icon__line--expanded" : ""}`}
                            ></span>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className={`top-4 fixed right-0 w-[50%] h-screen bg-white shadow-md max-w-[300px] transition-transform ease-in-out duration-500 ${fouldout ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="h-full flex flex-col justify-start ">
                    {user ? (
                        <a href="/signout" className="flex p-1 flex-row group justify-center py-2 ">
                            <p className="h2 group-hover:underline">Sign out</p>
                        </a>
                    ) : (
                        <a href="/signin" className="flex p-1 flex-row group justify-center py-2 ">
                            <p className="h2 group-hover:underline">Sign in</p>
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

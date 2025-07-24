"use client";

import { adminGetClients } from "@/api";
import { client } from "@/typing/users";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSearchParam, useSearchParamNumberList } from "../params";
import { ListSelect } from "./tools";

export const UserSelect = () => {
    const [clients, setClients] = useState<client[]>();
    const [loading, setLoading] = useState(false);

    const [id, setId] = useSearchParam("client_id");

    const getClients = async () => {
        setLoading(true);

        try {
            const response: any = await adminGetClients();

            if (response.data) {
                setClients(response.data.clients as client[]);
            } else if (response.error) {
                setClients(undefined);
                console.error("Error occurred:", response);
                if (response.error.detail == "Could not validate credentials") {
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getClients();
    }, [id]);

    return (
        <div className="p-2 bg-gray">
            Users
            <ListSelect
                searchParamKey="client_id"
                items={clients?.map((x) => {
                    return { id: x.id, val: x.full_name };
                })}
            />
        </div>
    );
};

export const UserMultiSelect = () => {
    const [clients, setClients] = useState<client[]>();
    const [loading, setLoading] = useState(false);

    const [ids, setIds] = useSearchParamNumberList("client_ids");

    const getClients = async () => {
        setLoading(true);

        try {
            const response: any = await adminGetClients();

            if (response.data) {
                setClients(response.data.clients as client[]);
            } else if (response.error) {
                setClients(undefined);
                console.error("Error occurred:", response);
                if (response.error.detail == "Could not validate credentials") {
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getClients();
    }, [ids]);

    return (
        <div className="h-full w-full inset-shadow rounded p-2 bg-gray">
            <div className=" h-full w-full">
                <p className="hsub">Users</p>
                <div className="py-2 overflow-y-auto">
                    <div className="bg-white rounded">
                        {clients?.map((x) => {
                            return (
                                <div
                                    onClick={() =>
                                        setIds((p) => {
                                            if (p.includes(x.id)) {
                                                return p.filter((y) => y != x.id);
                                            } else {
                                                return [...p, x.id];
                                            }
                                        })
                                    }
                                    key={x.id}
                                    className={`l flex flex-row gap-2 p-1 border-b border-gray overflow-hidden hover:cursor-pointer ${
                                        ids.includes(x.id) ? "underline" : ""
                                    }`}
                                >
                                    <p>{x.full_name}</p>
                                    <p>{x.email}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

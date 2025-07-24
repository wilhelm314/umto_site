"use client";

import { adminGetAgents, adminGetArtifacts, adminGetClients } from "@/api";
import { agent_list_item } from "@/app/typing/agents";
import { client } from "@/typing/users";
import { useAuthContext } from "@/components/auth/auth-context";
import { useSearchParam } from "@/components/params";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListSelect } from "./tools";

const AgentSelect = () => {
    const [agents, setAgents] = useState<agent_list_item[]>();
    const [loading, setLoading] = useState(false);
    const [agentID, setAgentID] = useSearchParam("agent_id");

    const getAgents = async () => {
        setLoading(true);

        try {
            const response: any = await adminGetAgents({});

            if (response.data) {
                setAgents(response.data.agents as agent_list_item[]);
            } else if (response.error) {
                setAgents(undefined);
                console.error("Error occurred:", response);
                if (response.error.detail == "Could not validate credentials") {
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAgents();
    }, [agentID]);

    return (
        <div className="p-2 bg-gray">
            Agents
            <ListSelect
                searchParamKey="agent_id"
                items={agents?.map((x) => {
                    return { id: x.id, val: x.name };
                })}
            />
        </div>
    );
};

export default AgentSelect;

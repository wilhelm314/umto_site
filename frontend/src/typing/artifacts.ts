export type artifact = {
    id: number,
    user_ids: number[],
    group_ids: number[],

    content: string,
    variable_name: string,
    is_preprompt: boolean,
    created_at: string,
    last_updated_at: string, 
}

export type artifact_list_item = {
    id: number,
    variable_name: string,
    is_preprompt: boolean,
    created_at: string,
    last_updated_at: string, 
}

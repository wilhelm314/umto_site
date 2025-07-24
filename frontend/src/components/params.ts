import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";




    // Original hook for single param values

const globalParams = new URLSearchParams("");

export function useSearchParam<ST extends string | number | boolean>(
    key: string
): [ST | undefined, (val: ST | undefined) => void] {
    const serialize = (value: ST): string => {
        if (typeof value === "boolean") {
            return value ? "true" : "false";
        }
        console.log(value);
        return value.toString();
    };

    const deserialize = (value: string | undefined): ST | undefined => {
        if (value === undefined) return undefined;
        if (value === "true") return true as ST;
        if (value === "false") return false as ST;
        const num = Number(value);
        return isNaN(num) ? value as ST : num as ST;
    };
    const searchParams = useSearchParams();
    const [param, setParam] = useState<ST | undefined>(() => {
        const value = searchParams.get(key);
        return deserialize(value ?? undefined) as ST;
    });
    const pathname = usePathname();
    const router = useRouter();


    const setValue = useCallback((value: ST | undefined) => {
        if (value === undefined) {
            globalParams.delete(key);
        } else {
            globalParams.set(key, serialize(value));
        }
        router.push(pathname + "?" + globalParams);
    }, [searchParams]);

    useEffect(() => {
        const value = searchParams.get(key);
        if (value === null) {
            globalParams.delete(key);
        } else {
            globalParams.set(key, value);
        }
        setParam(deserialize(value ?? undefined));
    }, [searchParams, key]);

    return [param, setValue];
}

// For number lists specifically
export function useSearchParamNumberList(
    key: string
): [number[], (valOrUpdater: number[] | ((prev: number[]) => number[])) => void] {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // Convert the URL param to number array
    const getNumberValues = useCallback(() => {
        const param = searchParams.get(key);
        return param ? param.split(',').map(Number).filter(n => !isNaN(n)) : [];
    }, [searchParams, key]);

    const [values, setValues] = useState<number[]>(getNumberValues());

    // Update URL when the array changes
    const setUrlValues = useCallback((valOrUpdater: number[] | ((prev: number[]) => number[])) => {
        // Handle both direct value and updater function
        const newValues = typeof valOrUpdater === 'function' 
            ? valOrUpdater([...values]) // Pass a copy to prevent accidental mutations
            : valOrUpdater;
            
        const x = new URLSearchParams(searchParams.toString());
        const paramValue = newValues.join(',');
        
        if (paramValue) {
            x.set(key, paramValue);
        } else {
            x.delete(key);
        }
        
        router.push(pathname + (x.toString() ? "?" + x.toString() : ""));
        
        // Update local state (necessary because router updates are not immediate)
        setValues(newValues);
    }, [searchParams, key, pathname, router, values]);

    // Keep local state in sync with URL
    useEffect(() => {
        setValues(getNumberValues());
    }, [searchParams, getNumberValues]);

    return [values, setUrlValues];
}
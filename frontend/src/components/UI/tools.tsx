"use client";

import { Dispatch, JSX, ReactNode, SetStateAction, use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParam, useSearchParamNumberList } from "../params";
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    filter,
    headingsPlugin,
    InsertTable,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    ListsToggle,
    markdownShortcutPlugin,
    MDXEditorMethods,
    quotePlugin,
    realmPlugin,
    setMarkdown$,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    UndoRedo,
} from "@mdxeditor/editor";
import { ForwardRefEditor } from "../richtext/ForwardRefEditor";
import nextAppLoader from "next/dist/build/webpack/loaders/next-app-loader";
import { artifactsPlugin, caretScrollPlugin } from "../richtext/Artifact";
import { JsxElement } from "typescript";

export function Button({
    children,
    funq,
    disabled,
    type,
    hidden,
}: {
    children: React.ReactNode;
    funq: () => void;
    disabled?: boolean;
    type?: "button" | "reset" | "submit" | undefined;
    hidden?: boolean | undefined;
}) {
    return (
        <button
            type={type}
            onClick={funq}
            disabled={disabled}
            className={`h-[2.5rem] max-w-5 p-1 l text-black rounded-xl border border-black ease-in-out duration-100  select-none ${
                hidden ? "hidden" : ""
            } ${disabled ? "text-black/20 border-black/20 bg-gray" : "bg-white hover:bg-gray"}`}
        >
            {
                <div className="flex flex-col h-full justify-center">
                    <div className="h-fit">{children}</div>
                </div>
            }
        </button>
    );
}

export function ListSelect({ searchParamKey, items }: { searchParamKey: string; items: { id: number; val: string }[] | undefined }) {
    const [id, setId] = useSearchParam(searchParamKey);

    return (
        <div className="h-full w-full rounded py-1 overflow-y-auto">
            <div className="bg-white rounded">
                {items?.map((x) => {
                    return (
                        <div
                            onClick={() => setId(id == x.id.toString() ? "" : x.id.toString())}
                            key={x.id}
                            className={`l select-none flex flex-row gap-2 p-1 border-b border-gray overflow-hidden hover:cursor-pointer ${
                                id == x.id.toString() ? "underline" : ""
                            }`}
                        >
                            <p className="l">{x.id}</p>
                            <p className="b">{x.val}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

type StateType<Type> = {
    value: Type;
    label: string;
    onChange: Dispatch<SetStateAction<Type>>;
    validator: (value: Type) => boolean;
};

type TextInputType = StateType<string> & {
    type: "text";
};

type RichTextType = StateType<string | undefined> & {
    type: "richtext";
    artifactsComplete?: boolean;
};

type StateColumnType<Type> = {
    type: "single" | "multiple";
    items: { id: number; name: string }[] | undefined;
} & StateType<Type>;

type entryProps = {
    onValidChange: (key: string, value: boolean) => void;
    edit: boolean | undefined;
};

interface StateColumnSingleType extends StateColumnType<number | undefined> {
    type: "single";
}

export interface StateColumnMultipleType extends StateColumnType<number[]> {
    type: "multiple";
}

function useValidator<Type>(x: {
    defaultValue: Type;
    label: string;
    onChange: (val: Type) => void;
    validator: (value: Type) => boolean;
    onValidChange: (key: string, value: boolean) => void;
}): [boolean | undefined, (val: Type) => void] {
    const _valid = x.validator(x.defaultValue);
    const [state, setState] = useState<boolean>(_valid);

    function setValidator(val: Type) {
        const _valid = x.validator(val);
        x.onChange(val);
        setState(_valid);
        x.onValidChange(x.label, _valid);
    }

    return [state, setValidator];
}

function StateColumnHeader(x: {
    edit?: boolean;
    label: string;
    popupVisible?: boolean;
    valid: boolean | undefined;
    setPopupVisible: (updater: (v: boolean | undefined) => boolean | undefined) => void;
}) {
    const [edit, setEdit] = useSearchParam<boolean>("edit");

    useEffect(() => {
        if (edit == false) {
            x.setPopupVisible((p) => false);
        }
    }, [edit]);

    return (
        <div className="flex flex-row justify-between">
            <label htmlFor={x.label} className={`l mb-1 ${!x.valid ? "text-[red]" : ""}`}>
                {x.label}
            </label>
            <div className="flex flex-row justify-end gap-1">
                <Button
                    hidden={x.popupVisible || !x.edit}
                    funq={() => {
                        // setTemp(x.ref.get);
                        x.setPopupVisible((p) => !p);
                    }}
                >
                    Open
                </Button>

                <Button
                    hidden={!x.popupVisible || !x.edit}
                    funq={() => {
                        x.setPopupVisible((p) => !p);
                    }}
                >
                    Close
                </Button>
            </div>
        </div>
    );
}

function matchesFilter(name: string, filter: string) {
    // Handle empty filter case
    if (!filter) return true;

    // Escape special regex characters
    const escapedFilter = filter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create a pattern that looks for characters in sequence but not necessarily adjacent
    const pattern = escapedFilter.split("").join(".*");

    // Create the regex object with case-insensitive flag
    const regex = new RegExp(pattern, "i");

    // Return whether the name matches the pattern
    return regex.test(name);
}

export function StateColumnSingle(x: StateColumnSingleType & entryProps) {
    const [popupVisible, setPopupVisible] = useState(x.edit);
    const [search, setSearch] = useState<string>("");
    const [valid, setValidator] = useValidator<number | undefined>({
        defaultValue: x.value,
        label: x.label,
        onChange: x.onChange,
        onValidChange: x.onValidChange,
        validator: x.validator,
    });

    useEffect(() => {
        setValidator(x.value);
    }, [x.value]);

    return (
        <div key={x.label} className=" p-1 flex flex-col border-t border-gray h-fit">
            <StateColumnHeader valid={valid} label={x.label} edit={x.edit} popupVisible={popupVisible} setPopupVisible={setPopupVisible} />
            <div className={`relative h-fit`}>
                <div className={`${popupVisible ? "hidden" : ""} pb-1 px-1 flex gap-1`}>
                    {x.items
                        ?.filter((y) => x.value == y.id)
                        .map((i) => {
                            return (
                                <div key={i.id} className="text-center w-fit b rounded-2xl px-1  bg-white border border-lightblue">
                                    {i.name}
                                </div>
                            );
                        })}
                </div>
                <div
                    className={`relative max-h-5 overflow-y-auto top-0 left-0 right-0 shadow bg-white p-1 my-1 rounded ${
                        popupVisible ? (valid ? "border border-black rounded" : "border border-[red] rounded") : "hidden"
                    }`}
                >
                    <input
                        className="w-full l sticky top-0 p-[5px] bg-[white] border border-black rounded"
                        type="text"
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter..."
                    />

                    {x.items
                        ?.filter((y) => matchesFilter(y.name, search))
                        .map((item) => {
                            return (
                                <div key={item.id} className="h-[3rem] flex flex-row justify-between">
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            item.id == x.value ? setValidator(undefined) : setValidator(item.id);
                                        }}
                                        className={`l  hover:cursor-pointer flex-grow `}
                                        disabled={!popupVisible}
                                    >
                                        <div className="h-full flex flex-row gap-2">
                                            <div className="flex flex-col h-full justify-center select-none">
                                                <div className={`w-1 h-1 rounded border  ${item.id == x.value ? "bg-darkblue" : ""}`}></div>
                                            </div>
                                            <div className="flex flex-col h-full justify-center select-none">
                                                <p className="h-fit">{item.id}</p>
                                            </div>
                                            <div className="flex flex-col h-full justify-center">
                                                <p className="h-fit">{item.name}</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export function StateColumnMultiple(x: StateColumnMultipleType & entryProps) {
    const [popupVisible, setPopupVisible] = useState(x.edit);
    const [search, setSearch] = useState<string>("");
    const [valid, setValidator] = useValidator({
        defaultValue: x.value,
        label: x.label,
        onChange: x.onChange,
        onValidChange: x.onValidChange,
        validator: x.validator,
    });

    useEffect(() => {
        setValidator(x.value);
    }, [x.value]);

    useEffect(() => {
        if (!x.edit) {
            setPopupVisible(false);
        }
    }, [x.edit]);

    return (
        <div key={x.label} className=" p-1 flex flex-col border-t border-gray h-fit">
            <StateColumnHeader valid={valid} label={x.label} edit={x.edit} popupVisible={popupVisible} setPopupVisible={setPopupVisible} />
            <div className={`relative h-fit`}>
                <div className={`${popupVisible ? "hidden" : ""} p-1 flex flex-wrap gap-1`}>
                    {x.items
                        ?.filter((y) => x.value.includes(y.id))
                        .map((i) => {
                            return (
                                <div key={i.id} className="text-center w-fit b rounded-2xl px-1  bg-white border border-lightblue">
                                    {i.name}
                                </div>
                            );
                        })}
                </div>

                <div
                    className={`relative max-h-[250px] overflow-y-auto top-0 left-0 right-0 shadow bg-white my-1 p-1 rounded ${
                        popupVisible ? (valid ? "border border-black rounded" : "border border-[red] rounded") : "hidden"
                    }`}
                >
                    <input
                        className="w-full l sticky top-0 p-[5px] bg-[white] border border-black rounded"
                        type="text"
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter..."
                    />

                    {x.items
                        ?.filter((y) => matchesFilter(y.name, search))
                        .map((item) => {
                            return (
                                <div key={item.id} className="h-[3rem] flex flex-row justify-between">
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            x.value.includes(item.id)
                                                ? setValidator(x.value.filter((y) => y != item.id))
                                                : setValidator([...x.value, item.id]);
                                        }}
                                        className={`l  hover:cursor-pointer flex-grow `}
                                        disabled={!popupVisible}
                                    >
                                        <div className="h-full flex flex-row gap-2">
                                            <div className="flex flex-col h-full justify-center select-none">
                                                <div
                                                    className={`w-1 h-1 rounded border  ${x.value.includes(item.id) ? "bg-darkblue" : ""}`}
                                                ></div>
                                            </div>
                                            <div className="flex flex-col h-full justify-center select-none">
                                                <p className="h-fit">{item.id}</p>
                                            </div>
                                            <div className="flex flex-col h-full justify-center">
                                                <p className="h-fit">{item.name}</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

function NameInput(x: TextInputType & entryProps) {
    const [valid, setValidator] = useValidator<string>({
        defaultValue: x.value,
        label: x.label,
        onChange: x.onChange,
        onValidChange: x.onValidChange,
        validator: x.validator,
    });
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!inputRef.current) return;
        inputRef.current.value = x.value;
        setValidator(x.value);
    }, [x.value, x.edit]);

    return (
        <div className="flex flex-row grow gap-1">
            <input
                ref={inputRef}
                type={"text"}
                defaultValue={x.value}
                onChange={(p) => {
                    setValidator(p.target.value);
                }}
                readOnly={!x.edit}
                required
                className={`min-w-2  ${!valid ? "border-[red] rounded" : "border-black rounded"} ${
                    x.edit ? "border h-[2.5rem] p-1 b w-full bg-[white]" : "!bg-white w-full "
                }`}
            />
        </div>
    );
}

function RichTextEditor(x: RichTextType & entryProps) {
    const defaultValue = x.value;
    const [valid, setValidator] = useValidator<string>({
        defaultValue: defaultValue ?? "",
        label: x.label,
        onChange: x.onChange,
        onValidChange: x.onValidChange,
        validator: x.validator,
    });
    const plugins = [
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        tablePlugin(),
        //toolbar plugin needs this css to avoid glitching...
        toolbarPlugin({
            toolbarClassName: `!sticky !top-[137px] !w-[calc(100%-1px)] !mx-[1px] ${x.edit ? "" : "!hidden"}`,
            toolbarContents: () => (
                <>
                    <UndoRedo />
                    <BlockTypeSelect />
                    <BoldItalicUnderlineToggles />
                    <ListsToggle />
                    <InsertTable />
                </>
            ),
        }),
    ];

    if (x.artifactsComplete) {
        plugins.push(artifactsPlugin());
        plugins.push(caretScrollPlugin());
    }

    const editorRef = useRef<MDXEditorMethods>(null);

    useEffect(() => {
        editorRef.current?.setMarkdown(defaultValue ?? "");
        setValidator(defaultValue ?? "");
    }, [x.value, x.edit]);

    return (
        <div
            className={`
                ${
                    x.edit
                        ? valid
                            ? "  border-[1px] border-black bg-[white] rounded"
                            : "bg-[white] border border-[red] rounded"
                        : "!bg-white"
                }
                w-full
                `}
        >
            <ForwardRefEditor
                ref={editorRef}
                plugins={plugins}
                markdown={defaultValue ?? ""}
                readOnly={!x.edit}
                onChange={(p) => {
                    setValidator(p);
                }}
                className={` p1 h-full relative !w-full !max-w-full  `}
                contentEditableClassName="prose !w-full !max-w-full block overflow-x-auto"
                placeholder="Enter some text here..."
                suppressHtmlProcessing={true}
            />
        </div>
    );
}

type Modal = {
    get: { title: string; body: string; comment?: { name: string; val: string }; action?: () => void } | undefined;
    set: (val: { title: string; body: string; comment?: { name: string; val: string }; action?: () => void } | undefined) => void;
};

type IdParams = {
    singular: { get: number | undefined; set: (val: number) => void };
    plural: {
        get: number[];
        set: (valOrUpdater: number[] | ((prev: number[]) => number[])) => void;
    };
};

const EntryListToolbar = (
    idParams: IdParams,
    deleting: boolean,
    loading: boolean,
    setEdit: (val: boolean | undefined) => void,
    modal?: Modal,
    deleteEntries?: () => void
) => {
    return (
        <div className=" bg-white h-fit sticky top-0 z-10 pb-3">
            <div className="  w-full border-b border-gray py-1 flex flex-row justify-between gap-2">
                {/*NAme */}

                {/*Buttons */}

                <div className="w-fit flex flex-row justify-end gap-1">
                    {idParams.plural.get.length > 0 ? (
                        <Button
                            funq={async () => {
                                idParams.plural.set([]);
                            }}
                            hidden={!(idParams.plural.get.length > 0)}
                            disabled={loading}
                        >
                            Clear selection
                        </Button>
                    ) : (
                        ""
                    )}
                    {deleteEntries ? (
                        <Button
                            funq={async () => {
                                modal?.set({
                                    title: "Are you sure?",
                                    body: "This action is irreversible!",
                                    action: deleteEntries,
                                });
                            }}
                            hidden={!(idParams.plural.get.length > 0)}
                            disabled={deleting}
                        >
                            Delete
                        </Button>
                    ) : (
                        ""
                    )}
                    <Button
                        funq={() => {
                            idParams.singular.set(-1);
                            setEdit(true);
                        }}
                        disabled={loading}
                        hidden={idParams.singular.get != null}
                    >
                        Create New
                    </Button>
                </div>
            </div>
        </div>
    );
};

export type EntryListItemProps = {
    loading: boolean;
    item: { id: number; val: string };
    idParams: IdParams;
};

const EntryListItemDefault = (props: EntryListItemProps) => {
    const [_, setEdit] = useSearchParam<boolean>("edit");

    return (
        <div key={props.item.id} className="h-[3rem] flex flex-row justify-between">
            <div className={`l overflow-hidden hover:cursor-pointer flex-grow `}>
                <div className="h-full flex flex-row ">
                    <div
                        className="flex flex-col h-full justify-center select-none w-4"
                        onClick={() => {
                            props.idParams.plural.set((p) => {
                                if (p.includes(props.item.id)) {
                                    return p.filter((y) => y != props.item.id);
                                } else {
                                    return [...p, props.item.id];
                                }
                            });
                        }}
                    >
                        <div className="w-full h-fit flex flex-row justify-center">
                            <div
                                className={`w-1 h-1 rounded border  ${
                                    props.idParams.plural.get.includes(props.item.id) ? "bg-darkblue" : ""
                                }`}
                            ></div>
                        </div>
                    </div>
                    <div
                        className="flex-grow flex flex-row justify-start gap-2"
                        onClick={() => {
                            props.idParams.singular.set(props.item.id);
                            setEdit(false);
                        }}
                    >
                        <div className="flex flex-col h-full justify-center select-none">
                            <p className="h-fit">{props.item.id}</p>
                        </div>
                        <div className=" flex flex-col h-full justify-center">
                            <p className="h-fit">{props.item.val}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-full flex flex-col justify-center">
                <Button
                    funq={() => {
                        props.idParams.singular.set(props.item.id);
                        setEdit(true);
                    }}
                    disabled={props.loading}
                >
                    Edit
                </Button>
            </div>
        </div>
    );
};

export function EntryList({
    loading,
    deleting,
    deleteEntries,
    modal,
    idParams,
    readonly = false,
    items,
    EntryListItem = EntryListItemDefault,
}: {
    loading: boolean;
    deleting: boolean;

    EntryListItem?: (props: EntryListItemProps) => JSX.Element;

    readonly?: boolean;

    deleteEntries?: () => void;

    modal?: Modal;

    idParams: IdParams;

    items: { id: number; val: string }[] | undefined;
}) {
    const [search, setSearch] = useState<string>("");
    const [_, setEdit] = useSearchParam<boolean>("edit");

    items?.sort((a, b) => b.id - a.id);

    function keysHandler(e: KeyboardEvent) {
        if (e.ctrlKey) {
            if (e.key == "s") {
                e.preventDefault();
            }
            if (e.key == "a") {
                e.preventDefault();

                idParams.plural.set(items?.filter((y) => matchesFilter(y.val, search)).map((x) => x.id) ?? []);
            }
        }
        if (e.key == "Escape") {
            e.preventDefault();
            if (modal?.get) {
                modal.set(undefined);
            } else {
                idParams.plural.set([]);
            }
        }
        if (e.key == "Delete") {
            e.preventDefault();
            modal?.set({
                title: "Are you sure?",
                body: "This action is irreversible!",
                action: deleteEntries,
            });
        }
        if (e.key == "Enter") {
            if (modal?.get) {
                e.preventDefault();
                modal?.get?.action ? modal.get.action() : "";
                modal.set(undefined);
            }
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", keysHandler);

        return () => {
            document.removeEventListener("keydown", keysHandler);
        };
    }, [search, items, modal?.get]);

    return (
        <div className="pt-3">
            {modal?.set ? <Modal get={modal?.get} set={modal?.set} loading={loading} /> : ""}

            {!readonly ? EntryListToolbar(idParams, deleting, loading, setEdit, modal, deleteEntries) : ""}

            <div className="h-full flex-grow w-full">
                <div className={`h-full w-full`}>
                    <div className="flex flex-col">
                        <div className="h-full w-full rounded p-1">
                            <div className="bg-white rounded">
                                <input
                                    className="w-full l sticky top-0 p-[5px] bg-[white] border border-black rounded"
                                    type="text"
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Filter..."
                                />
                                {items
                                    ?.filter((y) => matchesFilter(y.val, search))
                                    .map((x) => {
                                        return (
                                            <div key={x.id}>
                                                <EntryListItem loading={loading} idParams={idParams} item={x} />
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Modal({
    get,
    set,
    loading,
}: {
    get: { title: string; body: string; comment?: { name: string; val: string }; action?: () => void } | undefined;
    set: (val: { title: string; body: string; comment?: { name: string; val: string }; action?: () => void } | undefined) => void;
    loading: boolean;
}) {
    return (
        <div className={`${get ? "" : "hidden"} fixed z-20 left-0 top-0 right-0 bottom-0 grid`}>
            <div className="h-full w-full bg-black absolute opacity-30"></div>
            <div className="flex flex-row justify-center h-full w-full">
                <div className="flex flex-col justify-center h-full">
                    <div className="h-fit w-[600px] max-w-full bg-white z-30 p-2 rounded">
                        <p className="h2 select-none mb-1">{get?.title}</p>
                        <p className="b select-none mb-1">{get?.body}</p>
                        <div className="flex flex-row gap-3">
                            <p className="b select-none">{get?.comment?.name}</p>
                            <p className="l">{get?.comment?.val}</p>
                        </div>
                        <div className="flex flex-row justify-center pt-2">
                            {get?.action ? (
                                <div className="flex flex-row justify-between w-full">
                                    <Button disabled={loading} funq={() => set(undefined)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        disabled={loading}
                                        funq={() => {
                                            set(undefined);
                                            get?.action ? get.action() : "";
                                        }}
                                    >
                                        Proceed
                                    </Button>
                                </div>
                            ) : (
                                <Button disabled={loading} funq={() => set(undefined)}>
                                    Understood
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EntryItem({
    loading,
    deleting,
    deleteEntry,
    updateEntry,
    createEntry,
    idParams,
    refColumns,
    nameColumn,
    stateColumns,
    refreshCount: refreshCount,
    modal,
}: {
    loading: boolean;
    deleting: boolean;
    deleteEntry: () => void;
    updateEntry: () => Promise<boolean | undefined>;
    createEntry: () => Promise<boolean | undefined>;

    idParams: {
        singular: { get: number | undefined; set: (val: number | undefined) => void };
        plural: {
            get: number[];
            set: (valOrUpdater: number[] | ((prev: number[]) => number[])) => void;
        };
    };

    modal?: Modal;

    refColumns?: (TextInputType | RichTextType)[] | undefined;

    nameColumn: TextInputType | undefined;

    stateColumns?: (StateColumnType<number[]> | StateColumnType<number | undefined>)[];

    refreshCount: number;
}) {
    const [valid, setValid] = useState(false);
    const [edit, setEdit] = useSearchParam<boolean>("edit");
    const memNameColumn = useMemo(() => nameColumn, [refreshCount]);
    const memRefColumns = useMemo(() => refColumns, [refreshCount]);

    const [_, setValids] = useState<{ [key: string]: boolean }>({});

    const updateValids = (key: string, value: boolean) => {
        setValids((prev) => {
            if (prev[key] === value) return prev;
            const newValids = { ...prev, [key]: value };

            setValid(Object.values(newValids).every((v) => v));

            return newValids;
        });
    };

    const tryUpdateEntry = async () => {
        if (!(valid != undefined ? !valid : loading)) {
            const x = await updateEntry();
            if (x == true) {
                setEdit(false);
            } else {
                //TODO add tooltips
            }
        }
    };

    useEffect(() => {
        console.log("googoogaga");
    }, [refreshCount]);

    function keysHandler(e: KeyboardEvent) {
        if (e.ctrlKey) {
            if (e.key == "s") {
                e.preventDefault();
                tryUpdateEntry();
            }
            if (e.key == "e") {
                e.preventDefault();
                setEdit(true);
            }
            if (e.key == "a") {
                e.preventDefault();
            }
        }
        if (e.key == "Escape") {
            e.preventDefault();
            if (modal?.get) {
                modal.set(undefined);
            } else if (edit) {
                setEdit(false);
            } else {
                idParams.singular.set(undefined);
            }
        }
        if (e.key == "Delete") {
            e.preventDefault();
            modal?.set({
                title: "Are you sure?",
                body: "This action is irreversible!",
                action: deleteEntry,
            });
        }
        if (e.key == "Enter") {
            if (modal?.get) {
                e.preventDefault();
                modal?.get?.action ? modal.get.action() : "";
                modal.set(undefined);
            }
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", keysHandler);

        return () => {
            document.removeEventListener("keydown", keysHandler);
        };
    }, [modal?.get, valid, edit, refreshCount]);

    return (
        <div>
            {modal?.set ? <Modal get={modal?.get} set={modal?.set} loading={loading} /> : ""}
            <div className=" bg-white h-fit sticky top-0 z-10 py-3">
                <div className="  w-full border-b border-gray py-1 flex flex-row justify-between gap-2">
                    {/*NAme */}
                    <div className="h2">
                        {memNameColumn && <NameInput {...memNameColumn} onValidChange={updateValids} edit={edit ?? false} />}
                    </div>

                    {/*Buttons */}

                    <div className="w-fit flex flex-row justify-end gap-1">
                        <Button funq={tryUpdateEntry} hidden={edit} disabled={deleting}>
                            Delete
                        </Button>

                        <Button
                            funq={async () => {
                                const x = await updateEntry();
                                if (x == true) {
                                    setEdit(false);
                                } else {
                                    //TODO add tooltips
                                }
                            }}
                            hidden={!edit || idParams.singular.get == -1}
                            disabled={valid != undefined ? !valid : loading}
                        >
                            Update
                        </Button>

                        <Button
                            funq={() => {
                                setEdit(true);
                            }}
                            hidden={edit}
                            disabled={loading}
                        >
                            Edit
                        </Button>

                        <Button
                            funq={async () => {
                                const x = await createEntry();
                                if (x) {
                                    setEdit(false);
                                } else {
                                    //TOOLTIP
                                }
                            }}
                            hidden={idParams.singular.get != -1}
                            disabled={valid != undefined ? !valid : loading}
                        >
                            Create
                        </Button>

                        <Button
                            funq={() => {
                                setEdit(false);

                                idParams.singular.set(undefined);
                            }}
                            disabled={loading}
                            hidden={edit}
                        >
                            Back
                        </Button>

                        <Button
                            funq={() => {
                                setEdit(false);
                            }}
                            disabled={loading}
                            hidden={!edit}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex-grow w-full">
                <div className={`relative grid grid-cols-4 gap-3 w-full`}>
                    {/* Big fields editor */}
                    <div className="col-span-3 w-full pb-4">
                        <div className="w-full">
                            {memRefColumns?.map((x) => {
                                return (
                                    <div key={x.label} className={`pb-4 flex flex-col`}>
                                        <label htmlFor={x.label} className="l mb-1">
                                            {x.label}
                                        </label>
                                        {(() => {
                                            switch (x.type) {
                                                case "richtext": {
                                                    return (
                                                        <RichTextEditor
                                                            key={x.label}
                                                            {...(x as RichTextType)}
                                                            edit={edit}
                                                            onValidChange={updateValids}
                                                        />
                                                    );
                                                }
                                                case "text": {
                                                    return (
                                                        <NameInput
                                                            key={x.label}
                                                            {...(x as TextInputType)}
                                                            edit={edit}
                                                            onValidChange={updateValids}
                                                        />
                                                    );
                                                }
                                            }
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Multi value selectors */}
                    <div className="sticky top-[137px] self-start overflow-y-auto">
                        {/* Single columns with proper type narrowing */}
                        {stateColumns
                            ?.filter((col): col is StateColumnSingleType => col.type === "single")
                            .map((x) => (
                                <StateColumnSingle key={x.label} {...x} edit={edit} onValidChange={updateValids} />
                            ))}

                        {/* Multiple columns with proper type narrowing */}
                        {stateColumns
                            ?.filter((col): col is StateColumnMultipleType => col.type === "multiple")
                            .map((x) => (
                                <StateColumnMultiple key={x.label} {...x} edit={edit} onValidChange={updateValids} />
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

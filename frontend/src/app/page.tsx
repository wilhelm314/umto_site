"use client";

import { useAuthContext } from "@/components/auth/auth-context";
import { ForwardRefEditor } from "@/components/richtext/ForwardRefEditor";
import { PageBlock } from "@/components/tools";
import { BlockTypeSelect, BoldItalicUnderlineToggles, headingsPlugin, InsertTable, listsPlugin, ListsToggle, MDXEditorMethods, quotePlugin, tablePlugin, thematicBreakPlugin, toolbarPlugin, UndoRedo } from "@mdxeditor/editor";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

export default function Home() {

    const editorRef = useRef<MDXEditorMethods>(null);

    const { user } = useAuthContext()

    const [edit, setEdit] = useState(false)

    return <div className="h-full w-full flex flex-row justify-center">
        <div className={`fixed ${!user ? "hidden" : ""}`} onClick={() => {
            setEdit(p => !p)
        }}>
            TOGGLE EDIT
        </div>
        <div className="w-full max-w-[1024px]">

            <PageBlock edit={edit} content={[
                { color: "blue", heading: "OM", subheading: "UNGEMILJØERNES TAKEOVER", content: [{ type: "richtext", editorRef: editorRef }] },
                { color: "blue", heading: "", subheading: "Hvad er UMTO også?", content: [{ type: "richtext", editorRef: editorRef }] },
                { color: "black", heading: "OPLEV", subheading: "UNGEMILJØERNES TAKEOVER", content: [{ type: "richtext", editorRef: editorRef }] }
            ]} />



        </div>
    </div>;
}

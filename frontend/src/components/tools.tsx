import { BlockTypeSelect, BoldItalicUnderlineToggles, headingsPlugin, InsertTable, listsPlugin, ListsToggle, MDXEditorMethods, quotePlugin, RealmPlugin, tablePlugin, thematicBreakPlugin, toolbarPlugin, UndoRedo } from "@mdxeditor/editor"
import { ReactNode, RefObject } from "react"
import { UnionType } from "typescript"
import { ForwardRefEditor } from "./richtext/ForwardRefEditor"

type contentBlockListItem = {
    type: "list",
    entries: { id: number, text: string }
    funq: (id: number, text: string) => void
}

type contentBlockRichtextItem = {
    type: "richtext",
    editorRef: RefObject<MDXEditorMethods | null>
}

type contentBlockItem = contentBlockListItem | contentBlockRichtextItem


function RichText(params: { editorRef: RefObject<MDXEditorMethods | null>, textColor: string, edit: boolean }) {

    const plugins = [
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        tablePlugin(),
        //toolbar plugin needs this css to avoid glitching...
        toolbarPlugin({
            toolbarClassName: `prose !w-full !max-w-full ${!params.edit ? "!hidden" : ""}`,
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

    return (
        <ForwardRefEditor
            ref={params.editorRef}
            markdown={""}
            plugins={plugins}
            readOnly={!params.edit}
            contentEditableClassName={`prose !text-${params.textColor} !w-full !max-w-full block overflow-x-auto`}
            suppressHtmlProcessing={true}
        />
    )
}

interface contentBlockProps {
    color: string, heading: string, subheading: string, content: contentBlockItem[], edit: boolean
}

interface pageBlockProps {
    content: { color: string, heading: string, subheading: string, content: contentBlockItem[] }[]
    edit: boolean
}

export function PageBlock(params: pageBlockProps) {
    return (
        <div className="h-full w-full">
            {params.content.map((x, i) => {
                return (
                    <ContentBlock key={i} color={x.color} heading={x.heading} subheading={x.subheading} content={x.content} edit={params.edit} />
                )
            })}
        </div>
    )
}



function ContentBlock(params: contentBlockProps): ReactNode {
    return (
        <div className="w-full h-fit">
            <div className={`bg-${params.color} text-white w-full h1 p-2`}>
                <h1 className="h1">{params.heading}</h1>
                <h2 className="h2">{params.subheading}</h2>
            </div>
            <div className={`bg-white !text-${params.color} p-2 w-full`}>
                {params.content.map((x, i) => {
                    if (x.type == "richtext") {
                        return (
                            <RichText key={i} editorRef={x.editorRef} textColor={params.color} edit={params.edit} />
                        )
                    }



                })}
            </div>
        </div>
    )
}

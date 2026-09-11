import './StaticDocument.scss';

import { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { STATIC_PAGE_DIRECTORY } from './navigation';

export type StaticDocumentCategory = ('md' | 'txt');
export type StaticDocumentProps = { slug: string };
export default function StaticDocument({ slug }: StaticDocumentProps) {
    const page = STATIC_PAGE_DIRECTORY.get(slug);
    if (!page) { throw new Error(`Unmatched slug: ${slug}`); }
    const { filename } = page;

    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(
        () => {
            const controller = new AbortController();
            const path = `./docs/${filename}`;

            async function fetchContent() {
                try {
                    if (content !== null) return;
                    const response = await fetch(
                        path,
                        { signal: controller.signal },
                    );
                    if (!response.ok) {
                        throw new Error(`Failed to fetch from ${JSON.stringify(path)}: ${response.status}`);
                    }
                    setContent(await response.text());
                    setError(false);
                } catch (error) {
                    console.error(error);
                    setError(true);
                }
            }

            fetchContent();
        },
        [slug],
    );

    function StaticDocumentBody() {
        if (error) {
            return <div className="statusIndicator" role="alert">Unable to fetch text.</div>
        }
        if (content === null) {
            return <div className="statusIndicator">Loading&hellip;</div>;
        }
        return <article>
            {filename.endsWith('.md')
                ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                : <pre>{content}</pre>
            }
        </article>;
    }

    return (<div className="StaticDocument">
        <Header />
        <main className="contentContainer">
            <StaticDocumentBody />
        </main>

        <Footer />
    </div>);
}

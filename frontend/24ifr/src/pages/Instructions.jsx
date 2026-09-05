import { useEffect, useRef } from "react";

const InstructionsPage = () => {
    const iframeRef = useRef(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const handler = () => {
            try {
                iframe.style.height = iframe.contentWindow.document.body.scrollHeight + "px";
            } catch {
                iframe.style.height = "800px";
            }
        };
        iframe.addEventListener("load", handler);
        return () => iframe.removeEventListener("load", handler);
    }, []);

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide mb-6">
                Instructions
            </h1>
            <iframe
                ref={iframeRef}
                src={import.meta.env.VITE_DOCS_URL || "/docs/index.html"}
                title="ATC 24 IFR Documentation"
                className="w-full rounded-lg border border-border-dark"
                style={{ minHeight: "800px", height: "800px" }}
                sandbox="allow-scripts allow-same-origin"
            />
        </div>
    );
};

export default InstructionsPage;
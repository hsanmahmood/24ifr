const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const parseInline = (str) =>
    escapeHtml(str)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

export const renderMarkdown = (md = "") => {
    const lines = String(md || "").split(/\r?\n/);
    const out = [];
    let inList = false;

    for (const raw of lines) {
        const line = raw.trimEnd();

        const h3 = line.match(/^### (.+)/);
        if (h3) { if (inList) { out.push("</ul>"); inList = false; } out.push(`<h3>${parseInline(h3[1])}</h3>`); continue; }

        const h2 = line.match(/^## (.+)/);
        if (h2) { if (inList) { out.push("</ul>"); inList = false; } out.push(`<h2>${parseInline(h2[1])}</h2>`); continue; }

        const h1 = line.match(/^# (.+)/);
        if (h1) { if (inList) { out.push("</ul>"); inList = false; } out.push(`<h1>${parseInline(h1[1])}</h1>`); continue; }

        const li = line.match(/^[-*] (.+)/);
        if (li) { if (!inList) { out.push("<ul>"); inList = true; } out.push(`<li>${parseInline(li[1])}</li>`); continue; }

        if (line === "") { if (inList) { out.push("</ul>"); inList = false; } continue; }

        if (inList) { out.push("</ul>"); inList = false; }
        out.push(`<p>${parseInline(line)}</p>`);
    }

    if (inList) out.push("</ul>");
    return out.join("\n");
};

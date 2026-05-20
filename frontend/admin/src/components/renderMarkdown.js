const escapeHtml = (str = '') => str.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export const renderMarkdown = (md = '') => {
    const text = String(md || '');
    let out = escapeHtml(text);
    out = out.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    out = out.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    out = out.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    out = out.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    out = out.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    out = out.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    out = out.replace(/^[-\*] (.*$)/gim, '<li>$1</li>');
    out = out.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
    out = out.replace(/^(?!<h|<ul|<li|<h\d)(.+)$/gim, '<p>$1</p>');
    return out;
};

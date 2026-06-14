export function renderTemplate(content: string, data: Record<string, any>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.slice(2, -2)))];
}

export function highlightVariables(content: string): React.ReactNode {
  const parts = content.split(/(\{\{\w+\}\})/g);
  return parts.map((part, index) => {
    if (part.match(/\{\{\w+\}\}/)) {
      return <span key={index} className="bg-blue-100 text-blue-700 px-1 rounded font-mono text-sm">{part}</span>;
    }
    return <span key={index}>{part}</span>;
  });
}

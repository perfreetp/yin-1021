const VARIABLE_PATTERN = /\{\{([\u4e00-\u9fa5\w]+)\}\}/g;

export function renderTemplate(content: string, data: Record<string, any>): string {
  return content.replace(VARIABLE_PATTERN, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

export function extractVariables(content: string): string[] {
  const matches = content.match(VARIABLE_PATTERN) || [];
  return [...new Set(matches.map(m => m.slice(2, -2)))];
}

export function highlightVariables(content: string): React.ReactNode {
  const parts = content.split(VARIABLE_PATTERN);
  const result: React.ReactNode[] = [];
  let keyIndex = 0;
  let lastIndex = 0;
  let match;

  const globalRegex = new RegExp(VARIABLE_PATTERN.source, 'g');
  while ((match = globalRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      result.push(<span key={`text-${keyIndex++}`}>{content.slice(lastIndex, match.index)}</span>);
    }
    result.push(
      <span key={`var-${keyIndex++}`} className="bg-blue-100 text-blue-700 px-1 rounded font-mono text-sm">
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    result.push(<span key={`text-${keyIndex++}`}>{content.slice(lastIndex)}</span>);
  }

  return result;
}

'use client';

import Editor from '@monaco-editor/react';

interface SqlEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  readOnly?: boolean;
  onMount?: (editor: any, monaco: any) => void;
}

export function SqlEditor({ value, onChange, height = '400px', readOnly = false, onMount }: SqlEditorProps) {
  return (
    <div className="border border-slate-700/50 rounded-md overflow-hidden bg-[#1e1e1e]" style={{ height }}>
      <Editor
        height="100%"
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          readOnly,
          lineNumbersMinChars: 3,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          },
        }}
        loading={<div className="flex items-center justify-center h-full text-slate-500 text-sm">Carregando editor SQL...</div>}
      />
    </div>
  );
}

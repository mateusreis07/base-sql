'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyButton({ text, isN1 = false }: { text: string; isN1?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isN1) {
    return (
      <button 
        onClick={handleCopy}
        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95 ${
          copied 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        {copied ? 'Copiado para a prancheta!' : 'Copiar Query'}
      </button>
    );
  }

  return (
    <button 
      onClick={handleCopy}
      title="Copiar código SQL"
      className={`p-2 rounded-md transition-all border ${
        copied 
          ? 'bg-green-600/20 border-green-500/50 text-green-400' 
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

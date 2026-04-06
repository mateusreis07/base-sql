'use client';

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden bg-blue-500/10 pointer-events-none">
      <div 
        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[loading-bar_1.5s_infinite_ease-in-out] w-1/3" 
      />
    </div>
  );
}

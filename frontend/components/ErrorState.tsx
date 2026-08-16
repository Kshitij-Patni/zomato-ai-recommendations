interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className="w-full px-6 py-24 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-[#E8E8E8] rounded-2xl p-8 flex flex-col items-center text-center shadow-lg">
        <div className="w-20 h-20 rounded-full bg-[#ffdad6] flex items-center justify-center mb-6 shadow-sm">
          <span className="text-4xl drop-shadow-sm">😕</span>
        </div>
        <h3 className="font-[Lexend] text-2xl font-semibold text-[#1C1C1C] mb-2">
          Something went wrong
        </h3>
        <p className="text-base text-[#828282] mb-8">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 border border-[#E8E8E8] rounded-lg text-sm font-semibold text-[#1C1C1C] hover:bg-[#f9f9f9] hover:text-[#e23744] transition-all duration-300 flex items-center gap-2 group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-rotate-180 transition-transform duration-500">
            refresh
          </span>
          Retry Search
        </button>
      </div>
    </section>
  );
}

export default function EmptyState() {
  return (
    <section className="w-full py-24 flex flex-col items-center justify-center relative min-h-[400px]">
      {/* Concentric rings */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div
          className="absolute inset-0 border border-[rgba(226,55,68,0.2)] rounded-full animate-slow-pulse"
        />
        <div
          className="absolute inset-4 border border-[rgba(226,55,68,0.1)] rounded-full animate-slow-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute inset-8 border border-[#E8E8E8] rounded-full animate-slow-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Orbiting dot */}
        <div className="absolute w-2 h-2 bg-[#e23744] rounded-full shadow-[0_0_10px_rgba(226,55,68,0.5)] animate-orbit" />

        {/* Center emoji */}
        <div className="text-6xl animate-bounce drop-shadow-md">🍜</div>
      </div>

      <h3 className="mt-8 font-[Lexend] text-3xl font-bold text-[#1C1C1C] mb-2">
        Discover Your Perfect Meal
      </h3>
      <p className="text-base text-[#828282] max-w-sm text-center">
        Adjust your preferences above to begin the search.
      </p>

      <div className="mt-8 text-[rgba(226,55,68,0.7)] animate-bounce">
        <span className="material-symbols-outlined text-[32px]">
          arrow_upward
        </span>
      </div>
    </section>
  );
}

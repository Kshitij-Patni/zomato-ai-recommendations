export default function LoadingSkeleton() {
  const skeletons = Array.from({ length: 6 }, (_, i) => i);

  return (
    <section className="w-full px-6 py-16 max-w-[1200px] mx-auto">
      {/* Loading indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-6 h-6 rounded-full border-2 border-[rgba(226,55,68,0.3)] border-t-[#e23744] animate-spin" />
        <span className="text-lg text-[#828282]">
          Analyzing millions of reviews...
        </span>
      </div>

      {/* Skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skeletons.map((i) => (
          <div
            key={i}
            className={`bg-white border border-[#E8E8E8] rounded-xl p-5 relative overflow-hidden animate-fade-in-up ${
              i >= 2 ? "hidden md:block" : ""
            } ${i >= 3 ? "md:hidden lg:block" : ""}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full"
              style={{ animation: `shimmer 1.5s infinite ${i * 0.2}s` }}
            />
            {/* Rank + Rating row */}
            <div className="flex justify-between mb-4">
              <div className="skeleton-bar w-20 h-6" />
              <div className="skeleton-bar w-14 h-6" />
            </div>
            {/* Name */}
            <div className="skeleton-bar w-3/4 h-6 mb-2" />
            {/* Cuisine */}
            <div className="skeleton-bar w-1/2 h-4 mb-4" />
            {/* Cost */}
            <div className="skeleton-bar w-1/3 h-4 mb-6" />
            {/* AI Insight box */}
            <div className="skeleton-bar w-full h-24 rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}

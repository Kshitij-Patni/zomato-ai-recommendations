import { Recommendation } from "@/lib/types";
import RecommendationCard from "./RecommendationCard";

interface CardGridProps {
  recommendations: Recommendation[];
  aiPowered: boolean;
  totalMatches: number;
  onReset: () => void;
}

export default function CardGrid({
  recommendations,
  aiPowered,
  totalMatches,
  onReset,
}: CardGridProps) {
  return (
    <section className="w-full px-6 py-16 max-w-[1200px] mx-auto relative z-10">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-4 border-b border-[#E8E8E8]">
        <div>
          <h2 className="font-[Lexend] text-3xl font-bold text-[#1C1C1C] mb-2 tracking-tight">
            Top Recommendations
          </h2>
          <p className="text-base text-[#828282]">
            Curated specifically for your taste profile
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-3">
          {!aiPowered && (
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <span className="text-[12px] font-semibold tracking-[0.05em] text-amber-700">
                Without AI insights
              </span>
            </div>
          )}
          <div className="bg-[rgba(226,55,68,0.1)] border border-[rgba(226,55,68,0.2)] px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#e23744] shadow-[0_0_8px_rgba(226,55,68,0.5)]" />
            <span className="text-[12px] font-bold tracking-[0.05em] text-[#e23744]">
              {recommendations.length} Matches
            </span>
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, i) => (
          <RecommendationCard key={rec.rank} recommendation={rec} index={i} />
        ))}
      </div>

      {/* Search Again */}
      <div className="flex justify-center mt-10">
        <button
          onClick={onReset}
          className="px-6 py-3 border border-[#E8E8E8] rounded-lg text-sm font-semibold text-[#1C1C1C] hover:bg-[#f9f9f9] hover:text-[#e23744] transition-all duration-300 flex items-center gap-2 group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-rotate-180 transition-transform duration-500">
            refresh
          </span>
          Search Again
        </button>
      </div>
    </section>
  );
}

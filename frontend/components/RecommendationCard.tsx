import { Recommendation } from "@/lib/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export default function RecommendationCard({
  recommendation,
  index,
}: RecommendationCardProps) {
  const { rank, name, cuisine, rating, estimated_cost, explanation } =
    recommendation;

  // Rank badge styles
  const rankStyles: Record<number, string> = {
    1: "bg-[#e23744] text-white",
    2: "bg-white/90 text-[#1C1C1C] border border-[#E8E8E8]",
    3: "bg-white/90 text-[#1C1C1C] border border-[#E8E8E8]",
  };
  const rankClass = rankStyles[rank] || "bg-white/90 text-[#1C1C1C] border border-[#E8E8E8]";

  // Rating color
  const ratingColor =
    rating >= 4.5
      ? "text-[#24963F]"
      : rating >= 4.0
      ? "text-[#24963F]"
      : rating >= 3.5
      ? "text-[#F4A433]"
      : "text-[#e23744]";

  // Cost display
  const costSymbol =
    estimated_cost <= 500
      ? "$$"
      : estimated_cost <= 1500
      ? "$$$"
      : "$$$$";

  // Format cost in Indian format
  const formattedCost = `₹${estimated_cost.toLocaleString("en-IN")}`;

  // Cuisine tags
  const cuisineTags = cuisine
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      className="recommendation-card flex flex-col animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Top section: Rank + Rating */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div
            className={`px-2.5 py-1 rounded text-[12px] font-bold tracking-[0.05em] uppercase shadow-sm ${rankClass}`}
          >
            #{rank} Match
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E8E8E8] px-2 py-1 rounded">
            <span className={`text-sm font-semibold tabular-nums ${ratingColor}`}>
              {rating.toFixed(1)}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#e23744]">
              star
            </span>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-[Lexend] text-xl font-semibold text-[#1C1C1C] mb-1">
          {name}
        </h3>

        {/* Cuisine + Cost */}
        <div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.05em] text-[#828282] uppercase mb-3">
          {cuisineTags.map((tag, i) => (
            <span key={tag} className="flex items-center gap-2">
              {i > 0 && (
                <span className="w-1 h-1 rounded-full bg-[#E8E8E8]" />
              )}
              {tag}
            </span>
          ))}
          <span className="w-1 h-1 rounded-full bg-[#E8E8E8]" />
          <span className="text-[#828282]">{costSymbol}</span>
        </div>

        {/* Cost for two */}
        <p className="text-sm text-[#4F4F4F] mb-4">
          Cost for two: <span className="font-semibold text-[#1C1C1C]">{formattedCost}</span>
        </p>

        {/* AI Insight */}
        {explanation && (
          <div className="ai-insight-box mt-auto">
            <div className="flex items-center gap-1.5 mb-1.5 pl-2">
              <span className="material-symbols-outlined text-[#e23744] text-[14px]">
                auto_awesome
              </span>
              <span className="text-[10px] font-bold tracking-[0.1em] text-[#e23744] uppercase">
                AI Insight
              </span>
            </div>
            <p className="text-[13px] text-[#828282] leading-relaxed pl-2">
              {explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

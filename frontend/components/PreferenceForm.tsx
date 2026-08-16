"use client";

import { useState, useEffect } from "react";
import { UserPreferences } from "@/lib/types";
import { getLocations, getCuisines } from "@/lib/api";

interface PreferenceFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const BUDGET_OPTIONS = [
  { value: "low" as const, label: "Low" },
  { value: "medium" as const, label: "Medium" },
  { value: "high" as const, label: "High" },
];

export default function PreferenceForm({
  onSubmit,
  isLoading,
}: PreferenceFormProps) {
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<"low" | "medium" | "high">("medium");
  const [cuisine, setCuisine] = useState("");
  const [minRating, setMinRating] = useState(3.5);
  const [additionalPreferences, setAdditionalPreferences] = useState("");

  const [locations, setLocations] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);

  useEffect(() => {
    getLocations().then(setLocations);
    getCuisines().then(setCuisines);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      location: location || "bangalore",
      budget,
      cuisine: cuisine || (undefined as unknown as string),
      min_rating: minRating,
      additional_preferences: additionalPreferences.trim() || undefined,
    });
  };

  const formatLabel = (str: string) =>
    str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <section className="w-full px-6 pb-16 relative z-20">
      <div className="max-w-[720px] mx-auto w-full rounded-xl bg-white border border-[#E8E8E8] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eeeeee] flex items-center justify-center text-xl border border-[#E8E8E8]">
              📋
            </div>
            <div>
              <h2 className="font-[Lexend] text-2xl font-semibold text-[#1C1C1C]">
                Your Preferences
              </h2>
              <p className="text-[12px] text-[#828282] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">apartment</span>
                Bangalore
              </p>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold tracking-[0.05em] text-[#828282] uppercase">
                Location
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#828282] text-[18px] pointer-events-none z-10">
                  location_on
                </span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                  className="form-input form-input-icon select-input"
                >
                  <option value="">Entire Bangalore</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {formatLabel(loc)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold tracking-[0.05em] text-[#828282] uppercase">
                Budget
              </label>
              <div className="flex p-1 bg-[#f9f9f9] border border-[#E8E8E8] rounded-lg">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBudget(opt.value)}
                    disabled={isLoading}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                      budget === opt.value
                        ? "text-[#e23744] bg-white shadow-sm border border-[#E8E8E8]"
                        : "text-[#828282] hover:text-[#1C1C1C]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold tracking-[0.05em] text-[#828282] uppercase">
                Cuisine
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#828282] text-[18px] pointer-events-none z-10">
                  restaurant
                </span>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  disabled={isLoading}
                  className="form-input form-input-icon select-input"
                >
                  <option value="">All cuisines</option>
                  {cuisines.map((c) => (
                    <option key={c} value={c}>
                      {formatLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Min Rating */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-semibold tracking-[0.05em] text-[#828282] uppercase">
                  Min Rating
                </label>
                <span className="text-sm font-semibold text-[#e23744] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    star
                  </span>
                  {minRating.toFixed(1)}+
                </span>
              </div>
              <div className="pt-2">
                <input
                  type="range"
                  min="3"
                  max="5"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  disabled={isLoading}
                  className="w-full accent-[#e23744] h-1 bg-[#eeeeee] rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Additional Preferences */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold tracking-[0.05em] text-[#828282] uppercase">
              Vibe & Additional Preferences
            </label>
            <textarea
              value={additionalPreferences}
              onChange={(e) => setAdditionalPreferences(e.target.value)}
              placeholder="e.g. Rooftop seating, romantic lighting, good cocktails..."
              disabled={isLoading}
              rows={3}
              className="form-input resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#e23744] text-white font-[Lexend] text-lg font-medium py-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_4px_15px_rgba(226,55,68,0.3)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Finding restaurants…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
                Get AI Recommendations
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Recommendation, UserPreferences, ApiResponse } from "@/lib/types";
import { getRecommendations } from "@/lib/api";

interface UseRecommendationsReturn {
  data: Recommendation[];
  isLoading: boolean;
  error: string | null;
  aiPowered: boolean;
  hasSearched: boolean;
  totalMatches: number;
  fetchRecommendations: (prefs: UserPreferences) => Promise<void>;
  reset: () => void;
}

export function useRecommendations(): UseRecommendationsReturn {
  const [data, setData] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPowered, setAiPowered] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  const fetchRecommendations = useCallback(async (prefs: UserPreferences) => {
    setIsLoading(true);
    setError(null);
    setData([]);
    setHasSearched(true);

    try {
      const response: ApiResponse = await getRecommendations(prefs);

      if (response.success && response.recommendations) {
        setData(response.recommendations);
        setAiPowered(response.ai_powered ?? false);
        setTotalMatches(response.total_matches ?? response.count ?? 0);
      } else {
        setError(
          response.error ||
            "No restaurants match your criteria. Try broader preferences."
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setIsLoading(false);
    setError(null);
    setHasSearched(false);
    setTotalMatches(0);
  }, []);

  return {
    data,
    isLoading,
    error,
    aiPowered,
    hasSearched,
    totalMatches,
    fetchRecommendations,
    reset,
  };
}

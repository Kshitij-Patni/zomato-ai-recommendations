"use client";

import Header from "@/components/Header";
import PreferenceForm from "@/components/PreferenceForm";
import CardGrid from "@/components/CardGrid";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import { useRecommendations } from "@/hooks/useRecommendations";

export default function Home() {
  const {
    data,
    isLoading,
    error,
    aiPowered,
    hasSearched,
    totalMatches,
    fetchRecommendations,
    reset,
  } = useRecommendations();

  return (
    <>
      <Header />

      <main className="w-full pt-20 flex-1">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="w-full flex flex-col items-center justify-center text-center pt-24 pb-16 px-6 relative">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(226,55,68,0.05)] rounded-full blur-[100px] pointer-events-none" />

            <h1 className="font-[Lexend] text-5xl md:text-[48px] font-bold mb-6 relative z-10 tracking-tight leading-[1.1]">
              <span className="text-[#1C1C1C]">Find Your Perfect</span>
              <br />
              <span className="text-[#e23744]">Restaurant</span>
            </h1>
            <p className="text-lg text-[#4F4F4F] max-w-[560px] relative z-10 leading-relaxed">
              AI-powered recommendations from thousands of restaurants. Tell us
              what you want, and we&apos;ll find the best match.
            </p>
          </section>

          {/* Preference Form */}
          <PreferenceForm
            onSubmit={fetchRecommendations}
            isLoading={isLoading}
          />

          {/* Results Section */}
          {isLoading && <LoadingSkeleton />}

          {!isLoading && error && (
            <ErrorState message={error} onRetry={reset} />
          )}

          {!isLoading && !error && data.length > 0 && (
            <CardGrid
              recommendations={data}
              aiPowered={aiPowered}
              totalMatches={totalMatches}
              onReset={reset}
            />
          )}

          {!isLoading && !error && data.length === 0 && !hasSearched && (
            <EmptyState />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

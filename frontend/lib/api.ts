import { UserPreferences, ApiResponse } from "./types";

const API_BASE = "/api";

export async function getRecommendations(
  preferences: UserPreferences
): Promise<ApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status})`);
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCities(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/cities`);
    const data = await response.json();
    if (data.success) {
      return data.cities;
    }
    return [];
  } catch {
    return [];
  }
}

export async function getLocations(city?: string): Promise<string[]> {
  try {
    const url = city
      ? `${API_BASE}/locations?city=${encodeURIComponent(city)}`
      : `${API_BASE}/locations`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.success) {
      return data.locations;
    }
    return [];
  } catch {
    return [];
  }
}

export async function getCuisines(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/cuisines`);
    const data = await response.json();
    if (data.success) {
      return data.cuisines;
    }
    return [];
  } catch {
    return [];
  }
}

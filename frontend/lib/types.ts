export interface UserPreferences {
  location: string;
  budget: "low" | "medium" | "high";
  cuisine: string;
  min_rating: number;
  additional_preferences?: string;
}

export interface Recommendation {
  rank: number;
  name: string;
  cuisine: string;
  rating: number;
  estimated_cost: number;
  explanation: string;
  location: string;
  address?: string;
  online_order?: boolean;
  book_table?: boolean;
  rest_type?: string;
  votes?: number;
}

export interface ApiResponse {
  success: boolean;
  count?: number;
  total_matches?: number;
  ai_powered?: boolean;
  recommendations?: Recommendation[];
  error?: string;
  suggestions?: {
    available_locations?: string[];
  };
}


export interface AnalyzedItem {
  item_name: string;
  type: string;
  color: string;
  material?: string;
  pattern?: string;
  style_description?: string;
  brand?: string;
  exact_shop_link?: string; // New field
  exact_price?: string;     // New field
}

export interface OutfitAnalysisResult {
  identified_clothing: AnalyzedItem[];
  overall_impression: string;
}

export interface ProductSuggestion {
  product_name: string;
  shop_link: string;
  image_url?: string;
  price_estimate?: string;
}

export interface SimilarItemSuggestionGroup {
  original_item_query: string;
  suggestions: ProductSuggestion[];
}

export interface SimilarItemsSearchResult {
  similar_items_suggestions: SimilarItemSuggestionGroup[];
}

// Simplified structure for grounding chunks focusing on web URIs
export interface WebGroundingSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
 web?: WebGroundingSource;
 // other types of grounding chunks could exist, but we primarily care about 'web'
 // e.g., retrievalQuery?: string; retrievedPassages?: string[];
}
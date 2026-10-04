import type { Activity, ActivityProvider, ActivitySearchParams } from "./types";

type ViatorSearchProduct = {
  productCode?: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  images?: Array<{
    variants?: Array<{ url?: string; width?: number }>;
  }>;
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  pricing?: { summary?: { fromPrice?: number; fromPriceBeforeDiscount?: number } };
  duration?: { fixedDurationInMinutes?: number; variableDurationFromMinutes?: number };
  destinations?: Array<{ name?: string; ref?: string }>;
  tags?: Array<number | string>;
  productUrl?: string;
  flags?: string[];
};

type ViatorSearchResponse = {
  products?: ViatorSearchProduct[];
  totalCount?: number;
};

const OUTDOOR_TAG_HINTS = ["hiking", "kayak", "wildlife", "adventure", "climb", "boat", "nature"];

function pickImage(product: ViatorSearchProduct): string {
  const variants = product.images?.[0]?.variants ?? [];
  const sorted = [...variants].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return (
    sorted[0]?.url ??
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80"
  );
}

function inferActivityType(product: ViatorSearchProduct): string {
  const text = `${product.title ?? ""} ${product.description ?? ""}`.toLowerCase();
  if (text.includes("kayak") || text.includes("canoe") || text.includes("paddle")) return "kayaking";
  if (text.includes("climb") || text.includes("via ferrata")) return "climbing";
  if (text.includes("wildlife") || text.includes("safari") || text.includes("whale")) return "wildlife";
  if (text.includes("whisky") || text.includes("distillery") || text.includes("tasting")) {
    return "food-drink";
  }
  if (text.includes("hike") || text.includes("walk") || text.includes("trek")) return "hiking";
  if (text.includes("boat") || text.includes("cruise")) return "wildlife";
  return "sightseeing";
}

function mapProduct(product: ViatorSearchProduct, affiliateId: string): Activity | null {
  if (!product.productCode || !product.title) {
    return null;
  }

  const priceFrom = product.pricing?.summary?.fromPrice ?? 0;
  const destination = product.destinations?.[0]?.name ?? "Scotland";
  const productPath = product.productUrl ?? `https://www.viator.com/tours/d0-${product.productCode}`;
  const affiliateUrl = affiliateId
    ? `${productPath}${productPath.includes("?") ? "&" : "?"}pid=${encodeURIComponent(affiliateId)}`
    : productPath;

  return {
    provider: "viator",
    externalId: product.productCode,
    title: product.title,
    description: product.description ?? product.shortDescription ?? product.title,
    shortDescription: product.shortDescription,
    location: destination,
    region: "Scotland",
    activityType: inferActivityType(product),
    priceFrom,
    currency: "GBP",
    durationMinutes:
      product.duration?.fixedDurationInMinutes ?? product.duration?.variableDurationFromMinutes,
    rating: product.reviews?.combinedAverageRating,
    reviewCount: product.reviews?.totalReviews ?? 0,
    imageUrl: pickImage(product),
    affiliateUrl,
    tags: OUTDOOR_TAG_HINTS.filter((hint) =>
      `${product.title} ${product.description}`.toLowerCase().includes(hint),
    ),
    raw: product,
  };
}

export class ViatorActivityProvider implements ActivityProvider {
  readonly name = "viator";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly affiliateId: string,
    private readonly destinationId: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;version=2.0",
        "exp-api-key": this.apiKey,
        "Accept-Language": "en-US",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Viator API error ${response.status}: ${body.slice(0, 300)}`);
    }

    return (await response.json()) as T;
  }

  async searchActivities(params: ActivitySearchParams): Promise<Activity[]> {
    const filtering: Record<string, unknown> = {
      destination: this.destinationId,
    };

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      if (params.minPrice !== undefined) filtering.lowestPrice = params.minPrice;
      if (params.maxPrice !== undefined) filtering.highestPrice = params.maxPrice;
    }

    if (params.minRating !== undefined) {
      filtering.rating = { from: params.minRating, to: 5 };
    }

    if (params.minDurationMinutes !== undefined || params.maxDurationMinutes !== undefined) {
      filtering.durationInMinutes = {
        from: params.minDurationMinutes ?? 0,
        to: params.maxDurationMinutes ?? 24 * 60,
      };
    }

    const payload = {
      filtering,
      sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
      pagination: { start: 1, count: Math.min(params.limit ?? 30, 50) },
      currency: "GBP",
    };

    const data = await this.request<ViatorSearchResponse>("/products/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    let activities = (data.products ?? [])
      .map((product) => mapProduct(product, this.affiliateId))
      .filter((activity): activity is Activity => activity !== null);

    if (params.location) {
      const location = params.location.toLowerCase();
      activities = activities.filter((activity) =>
        activity.location.toLowerCase().includes(location),
      );
    }

    if (params.activityType) {
      activities = activities.filter(
        (activity) => activity.activityType === params.activityType?.toLowerCase(),
      );
    }

    if (params.query) {
      const q = params.query.toLowerCase();
      activities = activities.filter((activity) =>
        `${activity.title} ${activity.description}`.toLowerCase().includes(q),
      );
    }

    return activities;
  }

  async getActivity(id: string): Promise<Activity | null> {
    const product = await this.request<ViatorSearchProduct>(`/products/${encodeURIComponent(id)}`);
    return mapProduct(product, this.affiliateId);
  }

  async getAffiliateUrl(activity: Activity): Promise<string> {
    if (activity.affiliateUrl) {
      return activity.affiliateUrl;
    }
    const path = `https://www.viator.com/tours/d0-${activity.externalId}`;
    return this.affiliateId
      ? `${path}?pid=${encodeURIComponent(this.affiliateId)}`
      : path;
  }
}

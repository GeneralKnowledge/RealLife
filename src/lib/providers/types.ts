export type ActivitySearchParams = {
  location?: string;
  activityType?: string;
  minPrice?: number;
  maxPrice?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  minRating?: number;
  query?: string;
  limit?: number;
};

export type Activity = {
  provider: string;
  externalId: string;
  title: string;
  description: string;
  shortDescription?: string;
  location: string;
  region: string;
  activityType: string;
  priceFrom: number;
  currency: string;
  durationMinutes?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl: string;
  affiliateUrl: string;
  tags: string[];
  raw?: unknown;
};

export interface ActivityProvider {
  readonly name: string;
  searchActivities(params: ActivitySearchParams): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | null>;
  getAffiliateUrl(activity: Activity): Promise<string>;
}

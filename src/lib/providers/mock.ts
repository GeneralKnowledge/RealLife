import type { Activity, ActivityProvider, ActivitySearchParams } from "./types";

const SCOTLAND_ACTIVITIES: Activity[] = [
  {
    provider: "mock",
    externalId: "cairngorms-guided-hike",
    title: "Cairngorms National Park Guided Mountain Hike",
    description:
      "Leave the city skyline behind for granite ridges, ancient pinewoods, and weather that keeps you honest. A local guide leads a full-day hike through the Cairngorms with wildlife spotting and summit views when the cloud lifts.",
    shortDescription: "Full-day guided hike through Scotland's wildest national park.",
    location: "Cairngorms",
    region: "Scotland",
    activityType: "hiking",
    priceFrom: 65,
    currency: "GBP",
    durationMinutes: 480,
    rating: 4.9,
    reviewCount: 214,
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Cairngorms-Guided-Hike/d761-mock1",
    tags: ["hiking", "mountains", "wildlife", "day-trip"],
  },
  {
    provider: "mock",
    externalId: "loch-lomond-kayak",
    title: "Loch Lomond Kayaking Adventure",
    description:
      "Paddle across mirror-still water under the shadow of Ben Lomond. This half-day kayaking trip is built for beginners who still want a proper outdoor story to tell.",
    shortDescription: "Half-day kayaking on Loch Lomond with all gear included.",
    location: "Loch Lomond",
    region: "Scotland",
    activityType: "kayaking",
    priceFrom: 49,
    currency: "GBP",
    durationMinutes: 180,
    rating: 4.8,
    reviewCount: 389,
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Loch-Lomond-Kayak/d761-mock2",
    tags: ["kayaking", "water", "beginner-friendly"],
  },
  {
    provider: "mock",
    externalId: "skye-fairy-pools",
    title: "Isle of Skye Fairy Pools & Highlands Day Trip",
    description:
      "Cross the sea to Skye for turquoise pools, jagged Cuillin views, and enough drama to reset your entire week. Includes hotel pickup from Edinburgh or Glasgow options.",
    shortDescription: "Day trip to Skye's Fairy Pools and Highland viewpoints.",
    location: "Isle of Skye",
    region: "Scotland",
    activityType: "sightseeing",
    priceFrom: 89,
    currency: "GBP",
    durationMinutes: 720,
    rating: 4.7,
    reviewCount: 1520,
    imageUrl:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Skye-Fairy-Pools/d761-mock3",
    tags: ["sightseeing", "day-trip", "highlands"],
  },
  {
    provider: "mock",
    externalId: "glencoe-adventure",
    title: "Glencoe Valley Walking & Photography Tour",
    description:
      "Walk through the valley that defined Highland cinema. Expect brooding peaks, soft light, and a guide who knows when to shut up and let the landscape do the talking.",
    shortDescription: "Guided walking tour through Glencoe's cinematic valleys.",
    location: "Glencoe",
    region: "Scotland",
    activityType: "hiking",
    priceFrom: 55,
    currency: "GBP",
    durationMinutes: 300,
    rating: 4.9,
    reviewCount: 176,
    imageUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Glencoe-Walking/d761-mock4",
    tags: ["hiking", "photography", "highlands"],
  },
  {
    provider: "mock",
    externalId: "oban-wildlife-cruise",
    title: "Oban Wildlife Sea Cruise",
    description:
      "Leave the harbour behind for open water, seabird cliffs, and a chance at seals, porpoises, and the odd whale. Salt air guaranteed. Screen time optional.",
    shortDescription: "Wildlife-watching cruise from Oban along the west coast.",
    location: "Oban",
    region: "Scotland",
    activityType: "wildlife",
    priceFrom: 42,
    currency: "GBP",
    durationMinutes: 150,
    rating: 4.6,
    reviewCount: 642,
    imageUrl:
      "https://images.unsplash.com/photo-1559827260-db61d1fdd816?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Oban-Wildlife-Cruise/d761-mock5",
    tags: ["wildlife", "boat", "west-coast"],
  },
  {
    provider: "mock",
    externalId: "edinburgh-arthur-seat",
    title: "Arthur's Seat Sunrise Hike",
    description:
      "Beat the tour buses. Climb Edinburgh's extinct volcano before the city wakes and watch the Firth of Forth catch fire. Short, sharp, and worth the early alarm.",
    shortDescription: "Early morning guided ascent of Arthur's Seat.",
    location: "Edinburgh",
    region: "Scotland",
    activityType: "hiking",
    priceFrom: 28,
    currency: "GBP",
    durationMinutes: 120,
    rating: 4.8,
    reviewCount: 891,
    imageUrl:
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Edinburgh/Arthurs-Seat/d761-mock6",
    tags: ["hiking", "city-escape", "sunrise"],
  },
  {
    provider: "mock",
    externalId: "fort-william-via-ferrata",
    title: "Fort William Via Ferrata & Nevis Range",
    description:
      "Clip into steel cables and scramble along cliff paths above Glen Nevis. Adrenaline without needing a full mountaineering CV.",
    shortDescription: "Via ferrata climb with epic Nevis Range views.",
    location: "Fort William",
    region: "Scotland",
    activityType: "climbing",
    priceFrom: 75,
    currency: "GBP",
    durationMinutes: 210,
    rating: 4.9,
    reviewCount: 318,
    imageUrl:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Via-Ferrata/d761-mock7",
    tags: ["climbing", "adventure", "adrenaline"],
  },
  {
    provider: "mock",
    externalId: "speyside-whisky-walk",
    title: "Speyside Distillery Walk & Tasting",
    description:
      "Trade Slack for Speyside. A countryside walk between working distilleries with tastings that remind you Scotland invented the good stuff.",
    shortDescription: "Countryside walk with Speyside whisky tastings.",
    location: "Speyside",
    region: "Scotland",
    activityType: "food-drink",
    priceFrom: 58,
    currency: "GBP",
    durationMinutes: 240,
    rating: 4.7,
    reviewCount: 455,
    imageUrl:
      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Speyside-Whisky/d761-mock8",
    tags: ["whisky", "walking", "food-drink"],
  },
  {
    provider: "mock",
    externalId: "stirling-highland-safari",
    title: "Highland Safari from Stirling",
    description:
      "Four-wheel into open hills for red deer, Highland cattle, and views that make your phone camera feel inadequate. A proper half-day reset from the Central Belt.",
    shortDescription: "Off-road Highland wildlife safari from Stirling.",
    location: "Stirling",
    region: "Scotland",
    activityType: "wildlife",
    priceFrom: 69,
    currency: "GBP",
    durationMinutes: 240,
    rating: 4.8,
    reviewCount: 267,
    imageUrl:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/Highland-Safari/d761-mock9",
    tags: ["wildlife", "safari", "day-trip"],
  },
  {
    provider: "mock",
    externalId: "st-andrews-coastal-walk",
    title: "St Andrews Coastal Path & Sea Stacks",
    description:
      "Cliff-edge walking, North Sea wind, and ruins that outlast every trending topic. A coastal day that clears the browser tabs in your head.",
    shortDescription: "Guided coastal walk along the St Andrews shoreline.",
    location: "St Andrews",
    region: "Scotland",
    activityType: "hiking",
    priceFrom: 36,
    currency: "GBP",
    durationMinutes: 180,
    rating: 4.5,
    reviewCount: 142,
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80",
    affiliateUrl: "https://www.viator.com/tours/Scotland/St-Andrews-Coastal/d761-mock10",
    tags: ["hiking", "coast", "day-trip"],
  },
];

function matches(activity: Activity, params: ActivitySearchParams): boolean {
  if (params.location && !activity.location.toLowerCase().includes(params.location.toLowerCase())) {
    return false;
  }
  if (
    params.activityType &&
    activity.activityType.toLowerCase() !== params.activityType.toLowerCase()
  ) {
    return false;
  }
  if (params.minPrice !== undefined && activity.priceFrom < params.minPrice) {
    return false;
  }
  if (params.maxPrice !== undefined && activity.priceFrom > params.maxPrice) {
    return false;
  }
  if (
    params.minDurationMinutes !== undefined &&
    (activity.durationMinutes ?? 0) < params.minDurationMinutes
  ) {
    return false;
  }
  if (
    params.maxDurationMinutes !== undefined &&
    (activity.durationMinutes ?? Number.POSITIVE_INFINITY) > params.maxDurationMinutes
  ) {
    return false;
  }
  if (params.minRating !== undefined && (activity.rating ?? 0) < params.minRating) {
    return false;
  }
  if (params.query) {
    const q = params.query.toLowerCase();
    const haystack = `${activity.title} ${activity.description} ${activity.location} ${activity.tags.join(" ")}`.toLowerCase();
    if (!haystack.includes(q)) {
      return false;
    }
  }
  return true;
}

export class MockActivityProvider implements ActivityProvider {
  readonly name = "mock";

  async searchActivities(params: ActivitySearchParams): Promise<Activity[]> {
    const filtered = SCOTLAND_ACTIVITIES.filter((activity) => matches(activity, params));
    return filtered.slice(0, params.limit ?? 50);
  }

  async getActivity(id: string): Promise<Activity | null> {
    return SCOTLAND_ACTIVITIES.find((activity) => activity.externalId === id) ?? null;
  }

  async getAffiliateUrl(activity: Activity): Promise<string> {
    return activity.affiliateUrl;
  }
}

export const mockActivities = SCOTLAND_ACTIVITIES;

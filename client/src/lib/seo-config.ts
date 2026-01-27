export interface CityConfig {
  slug: string;
  name: string;
  filterValue: string;
}

export interface AgeGroupConfig {
  slug: string;
  name: string;
  filterValue: string;
}

export interface CategoryConfig {
  slug: string;
  name: string;
  categoryIds: number[];
  isGroup?: boolean;
}

export const cities: Record<string, CityConfig> = {
  sanfrancisco: {
    slug: "sanfrancisco",
    name: "San Francisco",
    filterValue: "San Francisco"
  },
  losangeles: {
    slug: "losangeles", 
    name: "Los Angeles",
    filterValue: "Los Angeles"
  }
};

export const ageGroups: Record<string, AgeGroupConfig> = {
  kids: {
    slug: "kids",
    name: "Kids",
    filterValue: "Kids"
  },
  adults: {
    slug: "adults",
    name: "Adults", 
    filterValue: "Adults"
  }
};

export const categories: Record<string, CategoryConfig> = {
  soccer: {
    slug: "soccer",
    name: "Soccer",
    categoryIds: [6]
  },
  basketball: {
    slug: "basketball",
    name: "Basketball",
    categoryIds: [5]
  },
  workouts: {
    slug: "workouts",
    name: "Workouts",
    categoryIds: [1, 2, 3, 4, 21],
    isGroup: true
  },
  yoga: {
    slug: "yoga",
    name: "Yoga",
    categoryIds: [2]
  },
  dance: {
    slug: "dance",
    name: "Dance",
    categoryIds: [11]
  },
  music: {
    slug: "music",
    name: "Music",
    categoryIds: [12]
  },
  art: {
    slug: "art",
    name: "Art",
    categoryIds: [13]
  },
  tennis: {
    slug: "tennis",
    name: "Tennis",
    categoryIds: [19]
  },
  gymnastics: {
    slug: "gymnastics",
    name: "Gymnastics",
    categoryIds: [8]
  }
};

export function generatePageTitle(
  citySlug: string,
  ageGroupSlug: string,
  categorySlug?: string
): string {
  const city = cities[citySlug];
  const ageGroup = ageGroups[ageGroupSlug];
  const category = categorySlug ? categories[categorySlug] : null;

  if (!city || !ageGroup) return "Classes | Trainn";

  if (category) {
    if (ageGroup.slug === "kids") {
      return `Kids ${category.name} Classes in ${city.name}`;
    } else {
      return `${ageGroup.name} ${category.name} in ${city.name}`;
    }
  }

  return `${city.name} ${ageGroup.name} Activities`;
}

export function generatePageHeader(
  citySlug: string,
  ageGroupSlug: string,
  categorySlug?: string
): string {
  return generatePageTitle(citySlug, ageGroupSlug, categorySlug);
}

export function generateMetaDescription(
  citySlug: string,
  ageGroupSlug: string,
  categorySlug?: string
): string {
  const city = cities[citySlug];
  const ageGroup = ageGroups[ageGroupSlug];
  const category = categorySlug ? categories[categorySlug] : null;

  if (!city || !ageGroup) return "Find and book local fitness classes on Trainn.";

  if (category) {
    if (ageGroup.slug === "kids") {
      return `Find the best ${category.name.toLowerCase()} classes for kids in ${city.name}. Book drop-in sessions with top local coaches. No commitments required.`;
    } else {
      return `Discover ${category.name.toLowerCase()} classes for adults in ${city.name}. Book outdoor and indoor sessions with certified instructors.`;
    }
  }

  if (ageGroup.slug === "kids") {
    return `Browse kids activities in ${city.name} including sports, arts, and more. Book drop-in classes with no long-term commitments.`;
  }

  return `Find adult fitness classes and activities in ${city.name}. Book workouts, sports, and wellness sessions with local coaches.`;
}

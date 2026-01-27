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

interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(
  citySlug: string,
  ageGroupSlug: string,
  categorySlug?: string
): object {
  const city = cities[citySlug];
  const ageGroup = ageGroups[ageGroupSlug];
  const category = categorySlug ? categories[categorySlug] : null;

  if (!city || !ageGroup) return {};

  const faqs: FAQItem[] = [];

  if (category && ageGroup.slug === "kids") {
    faqs.push({
      question: `What ages are kids ${category.name.toLowerCase()} classes available for in ${city.name}?`,
      answer: `Kids ${category.name.toLowerCase()} classes in ${city.name} are typically available for children ages 3-14, with age-appropriate groups. Check individual class listings for specific age requirements.`
    });
    faqs.push({
      question: `How much do drop-in ${category.name.toLowerCase()} classes cost for kids?`,
      answer: `Drop-in ${category.name.toLowerCase()} classes for kids typically range from $25-45 per session. No long-term commitments are required - you can book individual classes as they fit your schedule.`
    });
    faqs.push({
      question: `Do I need to bring equipment to kids ${category.name.toLowerCase()} classes?`,
      answer: `Most classes provide necessary equipment. We recommend bringing water, comfortable athletic clothing, and appropriate footwear. Check the class description for any specific requirements.`
    });
  } else if (category && ageGroup.slug === "adults") {
    faqs.push({
      question: `What skill levels are ${category.name.toLowerCase()} classes available for in ${city.name}?`,
      answer: `${category.name} classes in ${city.name} are available for all skill levels, from beginners to advanced. Each class listing indicates the recommended experience level.`
    });
    faqs.push({
      question: `How much do adult ${category.name.toLowerCase()} classes cost?`,
      answer: `Adult ${category.name.toLowerCase()} classes typically range from $20-50 per session. Drop-in classes require no membership or long-term commitment.`
    });
    faqs.push({
      question: `Are outdoor ${category.name.toLowerCase()} classes available?`,
      answer: `Yes! Many ${category.name.toLowerCase()} classes in ${city.name} are held outdoors in local parks. Filter by "Outdoors" to find classes in beautiful outdoor locations.`
    });
  } else if (ageGroup.slug === "kids") {
    faqs.push({
      question: `What types of kids activities are available in ${city.name}?`,
      answer: `${city.name} offers a variety of kids activities including sports (soccer, basketball, tennis), fitness classes, dance, music lessons, art classes, and more. All classes welcome drop-in participants.`
    });
    faqs.push({
      question: `Can I book a single class without a membership?`,
      answer: `Yes! All classes on Trainn are available as drop-in sessions. No memberships or long-term commitments required - just book the classes that work for your schedule.`
    });
    faqs.push({
      question: `How do I find activities near me in ${city.name}?`,
      answer: `Use our search filters to find activities by neighborhood, category, age group, and date. Each listing shows the exact location so you can find classes convenient to you.`
    });
  } else {
    faqs.push({
      question: `What types of adult fitness classes are available in ${city.name}?`,
      answer: `${city.name} offers a wide range of adult fitness classes including HIIT, yoga, strength training, cardio, outdoor boot camps, and more. All classes welcome drop-in participants.`
    });
    faqs.push({
      question: `Do I need to be fit to join adult fitness classes?`,
      answer: `Classes are available for all fitness levels! Each listing indicates whether it's suitable for beginners, intermediate, or advanced participants. Many coaches offer modifications for different abilities.`
    });
    faqs.push({
      question: `Are there outdoor workout classes in ${city.name}?`,
      answer: `Yes! ${city.name} has many outdoor workout options in local parks and beaches. Use the "Outdoors" filter to find classes held in beautiful outdoor settings.`
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(
  citySlug: string,
  ageGroupSlug: string,
  categorySlug?: string
): object {
  const city = cities[citySlug];
  const ageGroup = ageGroups[ageGroupSlug];
  const category = categorySlug ? categories[categorySlug] : null;

  if (!city || !ageGroup) return {};

  const items = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://trainn.pro"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Classes",
      "item": "https://trainn.pro/classes"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": city.name,
      "item": `https://trainn.pro/classes/${citySlug}/${ageGroupSlug}`
    }
  ];

  if (category) {
    items.push({
      "@type": "ListItem",
      "position": 4,
      "name": `${ageGroup.name} ${category.name}`,
      "item": `https://trainn.pro/classes/${citySlug}/${ageGroupSlug}/${categorySlug}`
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items
  };
}

import type { PageMetadata } from "./page-metadata";

// Defaults for older public pages without their own complete metadata component.
export const publicRouteMetadata: Record<string, PageMetadata> = {
  "/": { title: "Local Fitness, Sports & Creative Classes | Trainn", description: "Find and book fitness, sports and creative classes for adults and kids in San Francisco, Los Angeles and beyond." },
  "/about": { title: "About Trainn | Local Classes & Activity Providers", description: "Learn how Trainn connects adults and families with local fitness, sports and creative activity providers." },
  "/classes": { title: "Browse Local Classes | Trainn", description: "Explore upcoming fitness, sports and creative classes. Filter by city, age group, activity and date to find your next class." },
  "/coaches": { title: "Find Local Coaches & Activity Providers | Trainn", description: "Meet approved local coaches and activity providers. Explore their experience, specialties and upcoming classes on Trainn." },
  "/faq": { title: "Classes, Coaches & Booking FAQ | Trainn", description: "Find answers to common questions about discovering classes, booking sessions, cancellations and using Trainn." },
  "/provider-faq": { title: "Activity Provider FAQ | Trainn", description: "Answers for coaches and activity providers about listing classes, managing bookings and receiving payments on Trainn." },
  "/landing-pages": { title: "Local Activity Guides | Trainn", description: "Explore Trainn guides to outdoor workouts, kids sports and after-school activities in San Francisco." },
  "/outdoor-workouts-san-francisco": { title: "Outdoor Workouts in San Francisco | Trainn", description: "Explore outdoor fitness classes and local providers in San Francisco. Find group workouts, yoga and other activities in local parks." },
  "/kids-drop-in-sports-classes-san-francisco": { title: "Kids Drop-In Sports Classes in San Francisco | Trainn", description: "Discover kids drop-in sports classes in San Francisco. Explore local coaches, activities and flexible class bookings." },
  "/kids-after-school-activities-san-francisco": { title: "Kids After-School Activities in San Francisco | Trainn", description: "Find after-school activities for kids in San Francisco, including sports, art and music classes with local providers." },
  "/terms": { title: "Terms of Use | Trainn", description: "Read the terms governing use of Trainn, including accounts, class bookings, payments and provider responsibilities." },
  "/privacy": { title: "Privacy Policy | Trainn", description: "Learn how Trainn collects, uses and protects personal information, and read about your privacy choices." },
  "/cookies": { title: "Cookie Policy | Trainn", description: "Read how Trainn uses cookies and similar technologies, and learn about available cookie choices." },
  "/terms/dmca": { title: "Copyright & DMCA Policy | Trainn", description: "Read Trainn's copyright policy and learn how to submit a notice about potentially infringing content." },
  "/about/communityguidelines": { title: "Community Guidelines | Trainn", description: "Read the community guidelines for students, coaches and activity providers using Trainn." },
  "/terms/gifts": { title: "Gift Terms | Trainn", description: "Read the terms and conditions that apply to gifts offered through Trainn." },
  "/terms/customer-referrals": { title: "Customer Referral Terms | Trainn", description: "Read the eligibility requirements and terms for Trainn's customer referral program." },
};

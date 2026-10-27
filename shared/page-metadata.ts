// Shared with the initial-HTML rendering layer so route copy has one source.
export interface PageMetadata {
  title: string;
  description: string;
  noindex?: boolean;
}

export const publicPageMetadata = {
  "/plans": {
    title: "Subscription Plans - Trainn",
    description: "Explore Trainn monthly class-credit plans for eligible fitness, sports and creative classes under $40. Choose from 4, 8, 12, 16 or unlimited classes per month.",
  },
  "/blog": {
    title: "Fitness, Sports & Creative Activity Guides | Trainn Blog",
    description: "Read fitness tips, sports drills, music and art guides, and updates from the Trainn community to help you explore local classes and activities.",
  },
  "/contact": {
    title: "Contact Us | Trainn",
    description: "Contact Trainn with questions about local classes, bookings or becoming a provider. Send our team a message for help and support.",
  },
  "/provider-landing": {
    title: "Teach Classes & Grow Your Business | Trainn",
    description: "List your classes on Trainn, reach local students, and manage scheduling, bookings and payments. Explore the platform for coaches and activity providers.",
  },
  "/coach-resources": {
    title: "Coach Resources — Coming Soon | Trainn",
    description: "Preview the coaching guides and educational resources planned for Trainn providers. Our coach resource center is still in development.",
  },
  "/business-tools": {
    title: "Provider Business Tools — Coming Soon | Trainn",
    description: "Learn about the business tools planned for Trainn coaches and activity providers. This provider resource is still in development.",
  },
  "/coach-community": {
    title: "Coach Community — Coming Soon | Trainn",
    description: "Preview the community resources planned for Trainn coaches, including opportunities to connect and share ideas. This resource is still in development.",
  },
  "/success-stories": {
    title: "Provider Success Stories — Coming Soon | Trainn",
    description: "Documented provider case studies are not yet available. Explore Trainn's provider platform or contact our team while this resource is in development.",
    noindex: true,
  },
} satisfies Record<string, PageMetadata>;

export function getBlogPostMetadata(post: {
  title: string;
  metaDescription?: string | null;
  excerpt?: string | null;
}): PageMetadata {
  return {
    title: `${post.title} | Trainn`,
    description: post.metaDescription?.trim() || post.excerpt?.trim() || `Read ${post.title} on the Trainn blog.`,
  };
}

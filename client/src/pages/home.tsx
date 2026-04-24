import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import HeroSection from "@/components/home/hero-section";
import FeaturedClasses from "@/components/home/featured-classes";
import BookAgainClasses from "@/components/home/book-again-classes";
import WhyUseTrainn from "@/components/home/why-use-trainn";
import HowItWorks from "@/components/home/how-it-works";
import DownloadApp from "@/components/home/download-app";
import Testimonials from "@/components/home/testimonials";
import CTASection from "@/components/home/cta-section";
import { Helmet } from "react-helmet";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Book Fitness, Sports & Arts for Adults & Kids in San Francisco, Los Angeles and beyond | Trainn</title>
        <meta name="description" content="Trainn for top-rated fitness, sports, and art classes for adults and kids in San Francisco, Los Angeles and beyond. Experienced providers, flexible scheduling, no long-term commitments." />
        <meta property="og:title" content="Book Fitness, Sports and Other Fun Creative Classes for Adults & Kids in San Francisco, Los Angeles and beyond | Trainn" />
        <meta property="og:description" content="Find adult and kids focused drop-in fitness, sports, and creative classes in San Francisco, Los Angeles and beyond. Experienced providers, flexible scheduling, no long-term commitments." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainn.pro" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Book Fitness, Sports and Other Fun Creative Classes for Adults & Kids in San Francisco, Los Angeles and beyond | Trainn" />
        <meta name="twitter:description" content="Find adult and kids focused drop-in fitness, sports, and creative classes in San Francisco, Los Angeles and beyond. Experienced providers, flexible scheduling, no long-term commitments." />
        <link rel="canonical" href="https://trainn.pro" />
      </Helmet>
      <h1 className="sr-only">
  Fitness, Sports & Arts in San Francisco | Trainn
</h1>
      <Header />
      
      <main className="flex-grow">
        <HeroSection />
        <WhyUseTrainn />
        <HowItWorks />
        <FeaturedClasses />
        <BookAgainClasses />
        <DownloadApp />
        <Testimonials />
        <CTASection />
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}

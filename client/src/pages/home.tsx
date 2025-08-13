import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import HeroSection from "@/components/home/hero-section";
import SearchFilters from "@/components/home/search-filters";
import FeaturedClasses from "@/components/home/featured-classes";
import HowItWorks from "@/components/home/how-it-works";
import DownloadApp from "@/components/home/download-app";
import Testimonials from "@/components/home/testimonials";
import CTASection from "@/components/home/cta-section";
import { useState } from "react";
import { SearchFilters as SearchFiltersType } from "@/components/home/search-filters";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";

export default function Home() {
  const [, navigate] = useLocation();
  
  const handleSearch = (filters: SearchFiltersType) => {
    const queryParams = new URLSearchParams();
    
    if (filters.query) {
      queryParams.set('q', filters.query);
    }
    
    if (filters.classType) {
      queryParams.set('type', filters.classType);
    }
    
    if (filters.ageGroup) {
      queryParams.set('ageGroup', filters.ageGroup);
    }
    
    if (filters.city) {
      queryParams.set('city', filters.city);
    }
    
    if (filters.outdoors) {
      queryParams.set('outdoors', filters.outdoors);
    }
    
    if (filters.date) {
      queryParams.set('date', filters.date.toISOString());
    }
    
    if (filters.latitude && filters.longitude) {
      queryParams.set('lat', filters.latitude.toString());
      queryParams.set('lng', filters.longitude.toString());
    }
    
    const url = `/classes?${queryParams.toString()}`;
    navigate(url);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Trainn - fitness and creative classes for adults and kids</title>
        <meta name="description" content="Book fitness and creative classes for adults and kids in San Francisco Bay Area. Find local coaches for strength training, yoga, soccer, music, art, and more." />
        <meta property="og:title" content="Trainn - fitness and creative classes for adults and kids" />
        <meta property="og:description" content="Book fitness and creative classes for adults and kids in San Francisco Bay Area. Find local coaches for strength training, yoga, soccer, music, art, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainn.pro" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Trainn - fitness and creative classes for adults and kids" />
        <meta name="twitter:description" content="Book fitness and creative classes for adults and kids in San Francisco Bay Area. Find local coaches for strength training, yoga, soccer, music, art, and more." />
        <link rel="canonical" href="https://trainn.pro" />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        <HeroSection />
        <SearchFilters onSearch={handleSearch} showOnlyFutureCategories={true} />
        <HowItWorks />
        <FeaturedClasses />
        <DownloadApp />
        <Testimonials />
        <CTASection />
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}

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
      <Header />
      
      <main className="flex-grow">
        <HeroSection />
        <SearchFilters onSearch={handleSearch} />
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

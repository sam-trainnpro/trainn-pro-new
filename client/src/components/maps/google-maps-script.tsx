import { useEffect, useState } from 'react';

interface GoogleMapsScriptProps {
  children: React.ReactNode;
  onLoad?: () => void;
}

const GoogleMapsScript = ({ children, onLoad }: GoogleMapsScriptProps) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // If Google Maps is already loaded, don't load it again
    if (window.google && window.google.maps) {
      setLoaded(true);
      if (onLoad) onLoad();
      return;
    }
    
    // Create script element to load Google Maps API
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not found. Make sure VITE_GOOGLE_MAPS_API_KEY is set in your environment.');
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setLoaded(true);
      if (onLoad) onLoad();
    };
    
    script.onerror = () => {
      console.error('Error loading Google Maps API');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up script if component unmounts before script loads
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [onLoad]);
  
  // Show nothing while script is loading
  if (!loaded) return null;
  
  // Render children once Google Maps is loaded
  return <>{children}</>;
};

export default GoogleMapsScript;
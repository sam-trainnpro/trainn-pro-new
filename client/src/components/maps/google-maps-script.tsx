import { useEffect, useState } from 'react';

type GoogleMapsScriptLoadStatus = 'loading' | 'ready' | 'error';

interface GoogleMapsScriptProps {
  children: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

let isLoading = false;
let isLoaded = false;

// This component loads the Google Maps script and provides a loading status
export default function GoogleMapsScript({ children, onLoad, onError }: GoogleMapsScriptProps) {
  const [status, setStatus] = useState<GoogleMapsScriptLoadStatus>(
    // If the script is already loaded in a previous render, set the status to ready
    window.google && window.google.maps ? 'ready' : 'loading'
  );
  
  useEffect(() => {
    // Skip if already loaded or loading
    if (isLoaded || (window.google && window.google.maps)) {
      setStatus('ready');
      onLoad?.();
      return;
    }
    
    if (isLoading) {
      return;
    }
    
    isLoading = true;
    
    // Create the script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geocoding`;
    script.async = true;
    script.defer = true;
    
    // Set up callbacks
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      setStatus('ready');
      onLoad?.();
    };
    
    script.onerror = () => {
      isLoading = false;
      setStatus('error');
      onError?.();
    };
    
    // Append the script to the head
    document.head.appendChild(script);
    
    // Clean up the script on unmount
    return () => {
      // Don't remove the script element as it might be used by other components
    };
  }, [onLoad, onError]);
  
  return (
    <>
      {status === 'ready' && children}
      {status === 'loading' && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="ml-2">Loading Maps...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="p-4 text-center text-destructive">
          Failed to load Google Maps. Please refresh the page and try again.
        </div>
      )}
    </>
  );
}

// Hook to use Google Maps script
export function useGoogleMapsScript() {
  const [status, setStatus] = useState<GoogleMapsScriptLoadStatus>(
    window.google && window.google.maps ? 'ready' : 'loading'
  );
  
  useEffect(() => {
    if (window.google && window.google.maps) {
      setStatus('ready');
      return;
    }
    
    // Create a script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geocoding`;
    script.async = true;
    script.defer = true;
    
    // Set up callbacks
    script.onload = () => {
      setStatus('ready');
    };
    
    script.onerror = () => {
      setStatus('error');
    };
    
    // Check if script is already in the document
    if (!document.getElementById('google-maps-script')) {
      // Append the script to the head
      document.head.appendChild(script);
    }
    
    // Clean up
    return () => {
      // Don't remove the script
    };
  }, []);
  
  return status;
}
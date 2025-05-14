import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

type PlacesAutocompleteProps = {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  defaultValue?: string;
};

const PlacesAutocomplete = ({ 
  onAddressSelect, 
  placeholder = "Enter an address", 
  defaultValue = ""
}: PlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    
    // Check if Google Maps script is loaded
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key is missing!");
        return;
      }
      
      // Load Google Maps script if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      
      script.onload = () => {
        initAutocomplete();
      };
      
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }
    
    return () => {
      // Clean up
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);
  
  const initAutocomplete = () => {
    if (!inputRef.current || !window.google) return;
    
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ['address'] }
    );
    
    autocompleteRef.current.addListener('place_changed', () => {
      if (!autocompleteRef.current) return;
      
      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.error("No geometry information available for the selected place");
        return;
      }
      
      const address = place.formatted_address || '';
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      onAddressSelect(address, lat, lng);
    });
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      defaultValue={defaultValue}
    />
  );
};

export default PlacesAutocomplete;
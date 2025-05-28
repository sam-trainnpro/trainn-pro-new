import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type AddressComponents = {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

type PlacesAutocompleteProps = {
  onAddressSelect: (addressData: AddressComponents) => void;
  placeholder?: string;
  defaultValue?: string;
};

const PlacesAutocomplete = ({ 
  onAddressSelect, 
  placeholder = "Enter an address", 
  defaultValue = ""
}: PlacesAutocompleteProps) => {
  const autocompleteRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Load Google Maps script if needed
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        initializeAutocomplete();
      };
      
      document.head.appendChild(script);
    };
    
    loadGoogleMapsScript();
  }, []);
  
  // Initialize the new PlaceAutocompleteElement
  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }
    
    try {
      // Create the new PlaceAutocompleteElement
      const autocompleteElement = document.createElement('gmp-place-autocomplete') as any;
      autocompleteElement.setAttribute('placeholder', placeholder);
      autocompleteElement.setAttribute('type', 'establishment, geocode');
      
      // Add event listener for place selection
      autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
        const place = event.place;
        
        if (!place.location) {
          toast({
            title: "Invalid Location",
            description: "Please select a location from the dropdown",
            variant: "destructive"
          });
          return;
        }
        
        // Get coordinates
        const lat = place.location.lat();
        const lng = place.location.lng();
        
        // Parse address components
        const addressComponents = place.addressComponents || [];
        let addressLine1 = '';
        let city = '';
        let state = '';
        let zipCode = '';
        
        // Extract address components
        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            addressLine1 = component.longText + ' ';
          } else if (types.includes('route')) {
            addressLine1 += component.longText;
          } else if (types.includes('locality')) {
            city = component.longText;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.shortText;
          } else if (types.includes('postal_code')) {
            zipCode = component.longText;
          }
        });
        
        // If no street address found, use the place name
        if (!addressLine1.trim() && place.displayName) {
          addressLine1 = place.displayName;
        }
        
        const addressData: AddressComponents = {
          addressLine1: addressLine1.trim(),
          city: city,
          state: state,
          zipCode: zipCode,
          fullAddress: place.formattedAddress || '',
          lat: lat,
          lng: lng
        };
        
        // Pass data back to parent component
        onAddressSelect(addressData);
      });
      
      // Replace the container content with the new element
      if (autocompleteRef.current) {
        autocompleteRef.current.innerHTML = '';
        autocompleteRef.current.appendChild(autocompleteElement);
      }
      
    } catch (error) {
      console.error('Error initializing Google PlaceAutocompleteElement:', error);
      // Fallback to regular input if the new element fails
      if (autocompleteRef.current) {
        autocompleteRef.current.innerHTML = `<input type="text" placeholder="${placeholder}" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />`;
      }
    }
  };
  
  return (
    <div 
      ref={autocompleteRef}
      className="w-full"
      style={{ minHeight: '40px' }}
    />
  );
};

export default PlacesAutocomplete;
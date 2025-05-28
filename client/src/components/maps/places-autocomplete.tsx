import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
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

declare global {
  interface Window {
    google: any;
  }
}

const PlacesAutocomplete = ({ 
  onAddressSelect, 
  placeholder = "Enter an address", 
  defaultValue = ""
}: PlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!window.google?.maps?.places) return;
    
    if (!inputRef.current) return;
    
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['formatted_address', 'geometry', 'address_components', 'name']
      });
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          toast({
            title: "Invalid Location",
            description: "Please select a location from the dropdown",
            variant: "destructive"
          });
          return;
        }
        
        // Get coordinates
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Parse address components
        const addressComponents = place.address_components || [];
        let addressLine1 = '';
        let city = '';
        let state = '';
        let zipCode = '';
        
        // Extract address components
        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            addressLine1 = component.long_name + ' ';
          } else if (types.includes('route')) {
            addressLine1 += component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });
        
        // If no street address found, use the place name
        if (!addressLine1.trim() && place.name) {
          addressLine1 = place.name;
        }
        
        const addressData: AddressComponents = {
          addressLine1: addressLine1.trim(),
          city: city,
          state: state,
          zipCode: zipCode,
          fullAddress: place.formatted_address || '',
          lat: lat,
          lng: lng
        };
        
        // Pass data back to parent component
        onAddressSelect(addressData);
        setValue(place.name || place.formatted_address || '');
      });
      
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, []);
  
  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
    />
  );
};

export default PlacesAutocomplete;
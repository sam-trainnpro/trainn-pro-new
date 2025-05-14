import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

type PlacesAutocompleteProps = {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  defaultValue?: string;
};

// Create a custom implementation that doesn't rely on the Places Autocomplete directly
const PlacesAutocomplete = ({ 
  onAddressSelect, 
  placeholder = "Enter an address", 
  defaultValue = ""
}: PlacesAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [predictions, setPredictions] = useState<{ description: string, place_id: string }[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  
  // Function to fetch address predictions
  const getAddressPredictions = async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      return;
    }
    
    try {
      // Use our API proxy to get predictions
      const response = await fetch(
        `/api/maps/places/autocomplete?input=${encodeURIComponent(input)}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching address predictions:', error);
      setPredictions([]);
    }
  };
  
  // Function to get place details when a prediction is selected
  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `/api/maps/places/details?place_id=${placeId}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      if (data.result) {
        const { formatted_address, geometry } = data.result;
        if (formatted_address && geometry && geometry.location) {
          onAddressSelect(
            formatted_address,
            geometry.location.lat,
            geometry.location.lng
          );
          setInputValue(formatted_address);
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };
  
  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue && inputValue !== defaultValue) {
        getAddressPredictions(inputValue);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inputValue, defaultValue]);
  
  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowPredictions(true);
        }}
        onFocus={() => setShowPredictions(true)}
        placeholder={placeholder}
      />
      
      {/* Predictions dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-background rounded-md border shadow-lg">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2 hover:bg-muted cursor-pointer"
              onClick={() => {
                getPlaceDetails(prediction.place_id);
                setShowPredictions(false);
              }}
            >
              {prediction.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
import { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  ({ onPlaceSelect, value, onChange, className, placeholder, ...props }, ref) => {
    const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [inputValue, setInputValue] = useState(value || '');
    
    // Set up the ref forwarding
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(inputRef.current);
      } else if (ref) {
        ref.current = inputRef.current;
      }
    }, [ref]);

    // Update the input value when the value prop changes
    useEffect(() => {
      if (value !== undefined && value !== inputValue) {
        setInputValue(value);
      }
    }, [value]);

    // Initialize Google Places Autocomplete
    useEffect(() => {
      if (!inputRef.current || !window.google) return;
      
      // Initialize the autocomplete
      autoCompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        { types: ['address'] }
      );
      
      // Add place_changed listener
      const listener = autoCompleteRef.current.addListener('place_changed', () => {
        const place = autoCompleteRef.current?.getPlace();
        if (place && onPlaceSelect) {
          onPlaceSelect(place);
          
          // Update the input value
          const fullAddress = place.formatted_address || '';
          setInputValue(fullAddress);
          
          // Trigger onChange event with the new value
          if (onChange && inputRef.current) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            )?.set;
            
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(inputRef.current, fullAddress);
              const event = new Event('input', { bubbles: true });
              inputRef.current.dispatchEvent(event);
            }
          }
        }
      });
      
      // Clean up listener when component unmounts
      return () => {
        if (window.google && autoCompleteRef.current) {
          window.google.maps.event.removeListener(listener);
        }
      };
    }, [onPlaceSelect, onChange]);
    
    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };
    
    return (
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        className={className}
        placeholder={placeholder || "Enter address"}
        {...props}
      />
    );
  }
);

AddressAutocomplete.displayName = 'AddressAutocomplete';

export default AddressAutocomplete;
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

type InteractiveLocationPickerProps = {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
};

const InteractiveLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange,
  height = "300px",
  className = ""
}: InteractiveLocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ lat: latitude, lng: longitude });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      return;
    }

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Create draggable marker
    const markerInstance = new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: mapInstance,
      draggable: true,
      title: "Drag to adjust location"
    });

    // Listen for marker drag events
    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      if (position) {
        const newLat = position.lat();
        const newLng = position.lng();
        setCurrentPosition({ lat: newLat, lng: newLng });
        onLocationChange(newLat, newLng);
      }
    });

    // Listen for map clicks to move marker
    mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        markerInstance.setPosition({ lat: newLat, lng: newLng });
        setCurrentPosition({ lat: newLat, lng: newLng });
        onLocationChange(newLat, newLng);
      }
    });

    setMap(mapInstance);
    setMarker(markerInstance);

    return () => {
      // Cleanup
      if (markerInstance) {
        markerInstance.setMap(null);
      }
    };
  }, [latitude, longitude]);

  // Update marker position when props change
  useEffect(() => {
    if (marker && (latitude !== currentPosition.lat || longitude !== currentPosition.lng)) {
      marker.setPosition({ lat: latitude, lng: longitude });
      setCurrentPosition({ lat: latitude, lng: longitude });
      if (map) {
        map.setCenter({ lat: latitude, lng: longitude });
      }
    }
  }, [latitude, longitude, marker, map]);

  const resetToOriginal = () => {
    if (marker && map) {
      marker.setPosition({ lat: latitude, lng: longitude });
      map.setCenter({ lat: latitude, lng: longitude });
      setCurrentPosition({ lat: latitude, lng: longitude });
      onLocationChange(latitude, longitude);
    }
  };

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300"
      />
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Click or drag the pin to adjust the exact location</span>
        </div>
        {(currentPosition.lat !== latitude || currentPosition.lng !== longitude) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToOriginal}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default InteractiveLocationPicker;
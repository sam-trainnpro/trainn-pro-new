import { useEffect, useRef, useState } from 'react';

interface LocationPreviewProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  height?: string;
  className?: string;
}

const LocationPreview = ({ 
  latitude, 
  longitude,
  height = "200px",
  className = "mt-2 rounded-md overflow-hidden"
}: LocationPreviewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  
  useEffect(() => {
    if (!mapRef.current || !window.google || !latitude || !longitude) return;
    
    if (!mapInstance) {
      // Create map if it doesn't exist
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
      setMapInstance(map);
      
      // Create marker
      const newMarker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        animation: window.google.maps.Animation.DROP
      });
      setMarker(newMarker);
    } else {
      // Update existing map and marker
      const position = { lat: latitude, lng: longitude };
      mapInstance.setCenter(position);
      
      if (marker) {
        marker.setPosition(position);
      } else {
        // Create marker if it doesn't exist
        const newMarker = new window.google.maps.Marker({
          position,
          map: mapInstance,
          animation: window.google.maps.Animation.DROP
        });
        setMarker(newMarker);
      }
    }
  }, [latitude, longitude, mapInstance, marker]);
  
  if (!latitude || !longitude) {
    return null;
  }
  
  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ height }}
      data-testid="location-preview-map"
    />
  );
};

export default LocationPreview;
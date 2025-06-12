import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';

interface LocationPreviewProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  height?: string;
  className?: string;
  onLocationUpdate?: (lat: number, lng: number, address: string) => void;
  interactive?: boolean;
}

const LocationPreview = ({ 
  latitude, 
  longitude,
  height = "200px",
  className = "mt-2 rounded-md overflow-hidden",
  onLocationUpdate,
  interactive = true
}: LocationPreviewProps) => {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  
  useEffect(() => {
    if (!mapRef.current || !window.google || !latitude || !longitude) return;
    
    if (!mapInstance) {
      // Create map if it doesn't exist
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        draggableCursor: interactive ? 'crosshair' : 'default'
      });
      setMapInstance(map);
      
      // Create marker
      const newMarker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        animation: window.google.maps.Animation.DROP,
        draggable: interactive
      });
      setMarker(newMarker);
      
      // Create info window
      const newInfoWindow = new window.google.maps.InfoWindow({
        content: interactive ? 
          "<div style='text-align: center;'><strong>Drag to adjust location</strong><br>Click on the map to set a new pin</div>" :
          "<div>Selected location</div>"
      });
      setInfoWindow(newInfoWindow);
      
      // Show info window on marker click
      newMarker.addListener('click', () => {
        if (newInfoWindow) {
          newInfoWindow.open(map, newMarker);
        }
      });
      
      // Handle marker drag end event
      if (interactive && onLocationUpdate) {
        newMarker.addListener('dragend', async () => {
          const position = newMarker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            
            // Get address from coordinates using reverse geocoding
            try {
              const address = await getAddressFromCoordinates(lat, lng);
              onLocationUpdate(lat, lng, address);
            } catch (error) {
              console.error("Error getting address from coordinates:", error);
            }
          }
        });
        
        // Allow setting marker by clicking on the map
        map.addListener('click', async (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Update marker position
          newMarker.setPosition(event.latLng);
          
          // Get address from coordinates
          try {
            const address = await getAddressFromCoordinates(lat, lng);
            onLocationUpdate(lat, lng, address);
          } catch (error) {
            console.error("Error getting address from coordinates:", error);
          }
        });
      }
      
      // Show the info window initially to provide instructions
      if (interactive) {
        newInfoWindow.open(map, newMarker);
        
        // Close it after 3 seconds
        setTimeout(() => {
          newInfoWindow.close();
        }, 3000);
      }
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
          animation: window.google.maps.Animation.DROP,
          draggable: interactive
        });
        setMarker(newMarker);
      }
    }
  }, [latitude, longitude, mapInstance, marker, interactive, onLocationUpdate]);
  
  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject("Google Maps API not loaded");
        return;
      }
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0].formatted_address);
          } else {
            resolve("Unknown location");
          }
        }
      );
    });
  };
  
  if (!latitude || !longitude) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <div 
        ref={mapRef} 
        className={className}
        style={{ height }}
        data-testid="location-preview-map"
      />
      
      {interactive && (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <InfoIcon className="h-3 w-3 mr-1" />
            <span>You can click on the map or drag the pin to adjust the location</span>
          </div>
          
          {infoWindow && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs px-2 py-1"
              onClick={() => {
                if (mapInstance && marker && infoWindow) {
                  infoWindow.open(mapInstance, marker);
                  
                  setTimeout(() => {
                    if (infoWindow) {
                      infoWindow.close();
                    }
                  }, 3000);
                }
              }}
            >
              Show Help
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPreview;
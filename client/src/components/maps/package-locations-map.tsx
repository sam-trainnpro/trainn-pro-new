import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface SessionLocation {
  id: number;
  sessionNumber: number;
  location: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  sessionDate?: Date;
  sessionTime?: string;
}

interface PackageLocationsMapProps {
  primaryLocation: {
    name: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  sessionLocations?: SessionLocation[];
  height?: string;
  className?: string;
}

const PackageLocationsMap = ({ 
  primaryLocation,
  sessionLocations = [],
  height = "400px",
  className = "rounded-md overflow-hidden"
}: PackageLocationsMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    
    const hasValidPrimaryLocation = primaryLocation.latitude && primaryLocation.longitude;
    if (!hasValidPrimaryLocation) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Create map centered on primary location
    const map = new window.google.maps.Map(mapRef.current, {
      center: { 
        lat: primaryLocation.latitude!, 
        lng: primaryLocation.longitude! 
      },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    setMapInstance(map);
    
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new window.google.maps.LatLngBounds();
    
    // Add primary location marker (red)
    const primaryMarker = new window.google.maps.Marker({
      position: { 
        lat: primaryLocation.latitude!, 
        lng: primaryLocation.longitude! 
      },
      map: map,
      title: primaryLocation.name,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      animation: window.google.maps.Animation.DROP,
    });
    
    // Add info window for primary location
    const primaryInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
            📍 Primary Location
          </div>
          <div style="font-weight: 600; margin-bottom: 2px;">${primaryLocation.name}</div>
          ${primaryLocation.address ? `<div style="color: #666; font-size: 13px;">${primaryLocation.address}</div>` : ''}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            Default location for all sessions
          </div>
        </div>
      `
    });
    
    primaryMarker.addListener('click', () => {
      primaryInfoWindow.open(map, primaryMarker);
    });
    
    newMarkers.push(primaryMarker);
    bounds.extend(primaryMarker.getPosition()!);
    
    // Add session-specific location markers (blue)
    sessionLocations
      .filter(session => 
        session.latitude && 
        session.longitude && 
        session.location !== primaryLocation.name
      )
      .forEach((session, index) => {
        const marker = new window.google.maps.Marker({
          position: { 
            lat: session.latitude!, 
            lng: session.longitude! 
          },
          map: map,
          title: `Session ${session.sessionNumber}: ${session.location}`,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(35, 35)
          },
          animation: window.google.maps.Animation.DROP,
        });
        
        // Format session date and time if available
        let sessionDateTimeInfo = '';
        if (session.sessionDate && session.sessionTime) {
          const date = new Date(session.sessionDate);
          const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
          sessionDateTimeInfo = `<div style="font-size: 12px; color: #666; margin-top: 4px;">${dateStr} at ${session.sessionTime}</div>`;
        }
        
        // Add info window for session location
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #2563eb;">
                📌 Session ${session.sessionNumber}
              </div>
              <div style="font-weight: 600; margin-bottom: 2px;">${session.location}</div>
              ${session.address ? `<div style="color: #666; font-size: 13px;">${session.address}</div>` : ''}
              ${sessionDateTimeInfo}
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        
        newMarkers.push(marker);
        bounds.extend(marker.getPosition()!);
      });
    
    setMarkers(newMarkers);
    
    // Fit map to show all markers
    if (newMarkers.length > 1) {
      map.fitBounds(bounds);
      
      // Add some padding
      const listener = window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
      });
    }
    
    // Clean up markers on unmount
    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [primaryLocation, sessionLocations]);
  
  // Check if we have valid coordinates
  const hasValidLocation = primaryLocation.latitude && primaryLocation.longitude;
  
  if (!hasValidLocation) {
    return (
      <div className={`${className} bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center`} style={{ height }}>
        <div className="text-center text-gray-500 p-8">
          <MapPin className="mx-auto h-12 w-12 mb-3 text-gray-400" />
          <p className="font-medium">Location coordinates not available</p>
          <p className="text-sm mt-1">The provider hasn't set GPS coordinates for this location</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div 
        ref={mapRef} 
        className={className}
        style={{ height }}
        data-testid="package-locations-map"
      />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="text-muted-foreground">Primary Location</span>
        </div>
        {sessionLocations.some(s => s.latitude && s.longitude && s.location !== primaryLocation.name) && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Session-Specific Locations</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageLocationsMap;

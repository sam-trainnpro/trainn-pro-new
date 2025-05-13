import { useCallback, useMemo, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { Class, ClassWithSchedules } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface MapViewProps {
  classes: ClassWithSchedules[];
  onClassSelect?: (classId: number) => void;
}

// Default map container style
const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 37.7749, // San Francisco center
  lng: -122.4194
};

export default function MapView({ classes, onClassSelect }: MapViewProps) {
  const [selectedClass, setSelectedClass] = useState<ClassWithSchedules | null>(null);
  
  // Adjust map height based on container
  const [mapHeight, setMapHeight] = useState("600px");
  
  // Use callback ref to measure parent container height
  const mapContainerRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      // Set height to match parent container or use a default
      const parentHeight = node.parentElement?.clientHeight;
      if (parentHeight && parentHeight > 400) {
        setMapHeight(`${parentHeight}px`);
      } else {
        setMapHeight("600px");
      }
    }
  }, []);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const markers = useMemo(() => {
    return classes.map(classItem => ({
      id: classItem.id,
      position: {
        lat: classItem.latitude || defaultCenter.lat,
        lng: classItem.longitude || defaultCenter.lng
      },
      classItem
    }));
  }, [classes]);

  const onMarkerClick = useCallback((classItem: ClassWithSchedules) => {
    setSelectedClass(classItem);
    if (onClassSelect) {
      onClassSelect(classItem.id);
    }
  }, [onClassSelect]);

  if (loadError) {
    return <div className="p-4 bg-red-50 rounded-md">Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="p-4 flex justify-center items-center h-[600px] bg-gray-50 rounded-md">Loading map...</div>;
  }

  // Dynamic map container style with the adaptive height
  const dynamicMapContainerStyle = {
    width: "100%",
    height: mapHeight,
  };

  return (
    <div ref={mapContainerRef} className="relative rounded-lg overflow-hidden border border-gray-200">
      <GoogleMap
        mapContainerStyle={dynamicMapContainerStyle}
        zoom={12}
        center={defaultCenter}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => onMarkerClick(marker.classItem)}
            // No animation for now to avoid TypeScript errors
          />
        ))}

        {selectedClass && (
          <InfoWindow
            position={{
              lat: selectedClass.latitude || defaultCenter.lat,
              lng: selectedClass.longitude || defaultCenter.lng
            }}
            onCloseClick={() => setSelectedClass(null)}

          >
            <div className="max-w-xs">
              <h3 className="font-semibold text-lg">{selectedClass.title}</h3>
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {selectedClass.location}
              </p>
              {selectedClass.startTime && (
                <p className="text-sm mt-1">
                  {formatDate(new Date(selectedClass.startTime))} at {formatTime(new Date(selectedClass.startTime))}
                </p>
              )}
              <div className="mt-2">
                <p className="font-semibold">${selectedClass.price}</p>
              </div>
              <div className="mt-3">
                <Link href={`/classes/${selectedClass.id}`}>
                  <Button size="sm" className="w-full bg-primary text-white">View Details</Button>
                </Link>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
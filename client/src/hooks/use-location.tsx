import { useState, useEffect } from 'react';

interface LocationHookResult {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  getUserLocation: () => Promise<void>;
}

export function useLocation(): LocationHookResult {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getUserLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch (err: any) {
      if (err.code === 1) {
        setError('Location access denied. Please enable location services.');
      } else if (err.code === 2) {
        setError('Unable to determine your location. Please try again.');
      } else {
        setError('An error occurred while trying to access your location.');
      }
    } finally {
      setLoading(false);
    }
  };

  return { latitude, longitude, error, loading, getUserLocation };
}

import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Job, JobPriority, RouteOptimization } from '../types';

interface RouteMapProps {
  jobs: Job[];
  optimizedRoute?: RouteOptimization | null;
  isLoading: boolean;
}

interface GoogleMapsWindow extends Window {
  google?: {
    maps?: {
      Map?: any;
      Marker?: any;
      InfoWindow?: any;
      DirectionsService?: any;
      DirectionsRenderer?: any;
      LatLng?: any;
      Size?: any;
      TravelMode?: {
        DRIVING: string;
      };
      event?: {
        clearInstanceListeners: (instance: any) => void;
      };
    };
  };
}

declare const window: GoogleMapsWindow;

const RouteMap: React.FC<RouteMapProps> = ({ jobs, optimizedRoute, isLoading }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);

  useEffect(() => {
    console.log('🗺️ RouteMap useEffect triggered', {
      jobsLength: jobs?.length || 0,
      hasGoogleMaps: !!window.google,
      hasGoogleMapsAPI: !!(window.google && window.google.maps),
      mapRefExists: !!mapRef.current
    });
    
    // Initialize Google Map when jobs are available
    if (jobs && jobs.length > 0 && window.google && window.google.maps) {
      console.log('✅ Initializing Google Map...');
      initializeMap();
    } else {
      console.log('⚠️ Cannot initialize map:', {
        noJobs: !jobs || jobs.length === 0,
        noGoogleMaps: !window.google,
        noGoogleMapsAPI: !(window.google && window.google.maps)
      });
    }
  }, [jobs]);

  const initializeMap = (): void => {
    console.log('🚀 initializeMap called', {
      hasMapRef: !!mapRef.current,
      hasGoogleMaps: !!window.google,
      hasGoogleMapsAPI: !!(window.google && window.google.maps)
    });
    
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.error('❌ Cannot initialize map - missing dependencies:', {
        mapRef: !!mapRef.current,
        googleMaps: !!window.google,
        googleMapsAPI: !!(window.google && window.google.maps)
      });
      return;
    }

    try {
      // Center map on Puerto Rico
      const puertoRico = { lat: 18.2208, lng: -66.5901 };
      console.log('📍 Creating map centered on Puerto Rico:', puertoRico);
      
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: puertoRico,
        mapTypeId: 'roadmap',
      });

      console.log('✅ Google Map created successfully:', map);
      googleMapRef.current = map;

      // Add markers for each job
      jobs.forEach((job, index) => {
        if (job.Customer?.addressLatitude && job.Customer?.addressLongitude) {
          const marker = new window.google.maps.Marker({
            position: {
              lat: parseFloat(job.Customer.addressLatitude.toString()),
              lng: parseFloat(job.Customer.addressLongitude.toString())
            },
            map: map,
            title: job.jobName,
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            },
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="${getJobColor(job.priority)}" stroke="white" stroke-width="2"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(32, 32),
            }
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${job.jobName}</h4>
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Customer:</strong> ${job.Customer?.name}</p>
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Service:</strong> ${job.serviceType}</p>
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Priority:</strong> ${job.priority}</p>
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Duration:</strong> ${job.estimatedDuration} min</p>
                <p style="margin: 0; color: #666; font-size: 12px;"><strong>Address:</strong> ${job.Customer?.addressStreet}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      });

      // If we have an optimized route, draw the route lines
      if (optimizedRoute && optimizedRoute.route && optimizedRoute.route.length > 1) {
        drawOptimizedRoute(map, optimizedRoute.route);
      }
      
      console.log('🎯 Map initialization completed successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Map:', error);
    }
  };

  const drawOptimizedRoute = (map: any, routeJobs: Job[]): void => {
    console.log('🛣️ Drawing optimized route with', routeJobs.length, 'jobs');
    
    try {
      if (!window.google?.maps?.DirectionsService || !window.google?.maps?.DirectionsRenderer) {
        console.error('❌ Directions API not available');
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use our custom markers
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });

      directionsRenderer.setMap(map);

      // Create waypoints from jobs with coordinates
      const waypoints = routeJobs
        .filter(job => job.Customer?.addressLatitude && job.Customer?.addressLongitude)
        .map(job => ({
          location: new window.google.maps.LatLng(
            parseFloat(job.Customer!.addressLatitude!.toString()),
            parseFloat(job.Customer!.addressLongitude!.toString())
          ),
          stopover: true
        }));

      console.log('📍 Created waypoints:', waypoints.length);

      if (waypoints.length >= 2) {
        const origin = waypoints[0].location;
        const destination = waypoints[waypoints.length - 1].location;
        const waypointsMiddle = waypoints.slice(1, -1);

        console.log('🗺️ Requesting directions from Google Maps...');
        directionsService.route({
          origin: origin,
          destination: destination,
          waypoints: waypointsMiddle,
          optimizeWaypoints: false, // We've already optimized
          travelMode: window.google.maps.TravelMode.DRIVING,
        }, (result: any, status: string) => {
          console.log('📍 Directions result:', { status, result });
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            console.log('✅ Route drawn successfully');
          } else {
            console.error('❌ Directions request failed:', status);
          }
        });
      } else {
        console.log('⚠️ Not enough waypoints for route drawing:', waypoints.length);
      }
    } catch (error) {
      console.error('❌ Error drawing optimized route:', error);
    }
  };

  const getJobColor = (priority: JobPriority): string => {
    switch (priority) {
      case 'High': return '#dc2626';
      case 'Medium': return '#d97706';
      case 'Low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Map</h3>
        <div className="text-center py-24 bg-gray-50 rounded-lg">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No jobs scheduled for selected date</p>
          <p className="text-sm text-gray-500 mt-2">
            Schedule some jobs to see route optimization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
        {optimizedRoute && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              <span>{optimizedRoute.totalDistance} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.round(optimizedRoute.totalTime / 60)} hours</span>
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Optimizing route...</span>
        </div>
      ) : (
        <>
          <div 
            ref={mapRef} 
            style={{ width: '100%', height: '400px' }}
            className="rounded-lg border border-gray-200"
          />
          
          {/* Route Legend */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Low Priority</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RouteMap;
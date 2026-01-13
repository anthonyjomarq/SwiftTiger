import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';
import { Job, JobPriority, RouteOptimization } from '@/shared/types/business';
import { useDemoMode } from '@/demo/contexts/DemoModeContext';
import { demoMapMarkers, demoRoutePolyline } from '@/demo/data/demoData';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

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

export function RouteMap({ jobs, optimizedRoute, isLoading }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      initializeDemoMap();
    } else if (jobs && jobs.length > 0 && window.google && window.google.maps) {
      initializeMap();
    }
  }, [jobs, isDemoMode]);

  const initializeDemoMap = (): void => {
    if (!mapRef.current) return;

    // Create a simple demo map using HTML/CSS
    mapRef.current.innerHTML = `
      <div class="relative w-full h-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
        <!-- Demo map background -->
        <div class="absolute inset-0 bg-gray-200" style="background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23e5e5e5" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="white"/><rect width="100" height="100" fill="url(%23grid)"/></svg>'); opacity: 0.3;"></div>
        
        <!-- Puerto Rico outline (simplified) -->
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
          <path d="M50,120 Q80,100 120,110 Q160,105 200,115 Q240,110 280,120 Q320,115 350,125 Q370,130 380,140 Q375,150 350,155 Q300,160 250,155 Q200,150 150,155 Q100,160 60,150 Q40,140 50,120 Z" 
                fill="#10b981" fill-opacity="0.3" stroke="#059669" stroke-width="2"/>
          <text x="215" y="135" text-anchor="middle" fill="#059669" font-size="12" font-weight="bold">Puerto Rico</text>
        </svg>
        
        <!-- Demo markers -->
        ${demoMapMarkers.map((marker, index) => {
          const x = 50 + (marker.position.lng + 66.7) * 300;
          const y = 50 + (18.5 - marker.position.lat) * 200;
          const color = marker.priority === 'High' ? '#dc2626' : marker.priority === 'Medium' ? '#d97706' : '#16a34a';
          
          return `
            <div class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group" 
                 style="left: ${x}px; top: ${y}px;" 
                 onclick="showDemoInfo('${marker.id}', '${marker.title}', '${marker.customer}', '${marker.priority}', '${marker.time}')">
              <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold"
                   style="background-color: ${color}">
                ${index + 1}
              </div>
              <!-- Tooltip -->
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                <div class="font-semibold">${marker.title}</div>
                <div>${marker.customer} - ${marker.time}</div>
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          `;
        }).join('')}
        
        <!-- Demo route line -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200">
          <polyline points="${demoRoutePolyline.map(point => {
            const x = 50 + (point.lng + 66.7) * 300;
            const y = 50 + (18.5 - point.lat) * 200;
            return `${x},${y}`;
          }).join(' ')}" 
                    fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="5,5" opacity="0.8"/>
        </svg>
        
        <!-- Demo mode indicator -->
        <div class="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
            Demo Map
          </div>
        </div>
        
        <!-- Demo info panel -->
        <div id="demo-info" class="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs hidden">
          <div id="demo-info-content"></div>
        </div>
      </div>
    `;

    // Add click handler for demo markers
    (window as any).showDemoInfo = (_id: string, title: string, customer: string, priority: string, time: string) => {
      const infoPanel = document.getElementById('demo-info');
      const infoContent = document.getElementById('demo-info-content');
      
      if (infoPanel && infoContent) {
        infoContent.innerHTML = `
          <h4 class="font-semibold text-gray-900 mb-2">${title}</h4>
          <div class="space-y-1 text-sm text-gray-600">
            <div><span class="font-medium">Customer:</span> ${customer}</div>
            <div><span class="font-medium">Priority:</span> <span class="font-semibold" style="color: ${priority === 'High' ? '#dc2626' : priority === 'Medium' ? '#d97706' : '#16a34a'}">${priority}</span></div>
            <div><span class="font-medium">Time:</span> ${time}</div>
          </div>
          <button onclick="document.getElementById('demo-info').classList.add('hidden')" 
                  class="mt-3 text-xs text-blue-600 hover:text-blue-800">Close</button>
        `;
        infoPanel.classList.remove('hidden');
      }
    };
  };

  const initializeMap = (): void => {
    console.log('[RouteMap] initializeMap called', {
      hasMapRef: !!mapRef.current,
      hasGoogleMaps: !!window.google,
      hasGoogleMapsAPI: !!(window.google && window.google.maps)
    });
    
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.error('[RouteMap] Cannot initialize map - missing dependencies:', {
        mapRef: !!mapRef.current,
        googleMaps: !!window.google,
        googleMapsAPI: !!(window.google && window.google.maps)
      });
      return;
    }

    try {
      // Center map on Puerto Rico
      const puertoRico = { lat: 18.2208, lng: -66.5901 };
      console.log('Creating map centered on Puerto Rico:', puertoRico);
      
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: puertoRico,
        mapTypeId: 'roadmap',
      });

      console.log('[RouteMap] Google Map created successfully:', map);
      googleMapRef.current = map;

      // Add markers for each job
      jobs.forEach((job, index) => {
        if (job.Customer?.addressLatitude && job.Customer?.addressLongitude && window.google?.maps) {
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
      
      console.log('Map initialization completed successfully');
    } catch (error) {
      console.error('[RouteMap] Error initializing Google Map:', error);
    }
  };

  const drawOptimizedRoute = (map: any, routeJobs: Job[]): void => {
    console.log('Drawing optimized route with', routeJobs.length, 'jobs');
    
    try {
      if (!window.google?.maps?.DirectionsService || !window.google?.maps?.DirectionsRenderer) {
        console.error('Directions API not available');
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
        .filter(job => job.Customer?.addressLatitude && job.Customer?.addressLongitude && window.google?.maps)
        .map(job => ({
          location: new window.google!.maps!.LatLng(
            parseFloat(job.Customer!.addressLatitude!.toString()),
            parseFloat(job.Customer!.addressLongitude!.toString())
          ),
          stopover: true
        }));

      console.log('Created waypoints:', waypoints.length);

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
          travelMode: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING',
        }, (result: any, status: string) => {
          console.log('Directions result:', { status, result });
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
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
          {isDemoMode && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Demo Mode</span>
            </div>
          )}
        </div>
        {!isDemoMode && optimizedRoute && (
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
        {isDemoMode && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              <span>42.3 km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>3.2 hours</span>
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-gray-50 rounded-lg">
          <LoadingSpinner />
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
}
export const demoMapMarkers = [
  {
    id: 'job-1',
    position: { lat: 18.4655, lng: -66.1057 }, // San Juan
    title: 'AC Repair - Downtown Office',
    priority: 'High',
    customer: 'ABC Corporation',
    status: 'Scheduled',
    time: '10:00 AM'
  },
  {
    id: 'job-2', 
    position: { lat: 18.3951, lng: -66.0764 }, // Carolina
    title: 'Electrical Installation',
    priority: 'Medium',
    customer: 'Home Depot',
    status: 'In Progress',
    time: '12:00 PM'
  },
  {
    id: 'job-3',
    position: { lat: 18.2208, lng: -66.5901 }, // Arecibo
    title: 'Plumbing Maintenance',
    priority: 'Low',
    customer: 'Local Restaurant',
    status: 'Completed',
    time: '2:00 PM'
  },
  {
    id: 'job-4',
    position: { lat: 18.0078, lng: -66.6140 }, // Mayaguez
    title: 'HVAC System Check',
    priority: 'High',
    customer: 'Hospital Centro Medico',
    status: 'Scheduled',
    time: '4:00 PM'
  },
  {
    id: 'job-5',
    position: { lat: 17.9714, lng: -66.2266 }, // Ponce
    title: 'Generator Service',
    priority: 'Medium',
    customer: 'Manufacturing Plant',
    status: 'Pending',
    time: '8:00 AM'
  }
];

export const demoRoutePolyline = [
  { lat: 18.4655, lng: -66.1057 }, // San Juan
  { lat: 18.4580, lng: -66.1050 }, // Route point
  { lat: 18.4200, lng: -66.0900 }, // Route point
  { lat: 18.3951, lng: -66.0764 }, // Carolina
  { lat: 18.3500, lng: -66.2000 }, // Route point
  { lat: 18.2800, lng: -66.3500 }, // Route point
  { lat: 18.2208, lng: -66.5901 }, // Arecibo
  { lat: 18.1500, lng: -66.6000 }, // Route point
  { lat: 18.0500, lng: -66.6100 }, // Route point
  { lat: 18.0078, lng: -66.6140 }, // Mayaguez
  { lat: 18.0000, lng: -66.5000 }, // Route point
  { lat: 17.9850, lng: -66.3500 }, // Route point
  { lat: 17.9714, lng: -66.2266 }  // Ponce
];

export const demoAddressSuggestions = [
  {
    place_id: 'demo_1',
    description: '123 Calle Fortaleza, San Juan, PR 00901',
    geometry: {
      location: { lat: 18.4655, lng: -66.1057 }
    }
  },
  {
    place_id: 'demo_2', 
    description: '456 Ave. Ashford, Condado, San Juan, PR 00907',
    geometry: {
      location: { lat: 18.4580, lng: -66.1050 }
    }
  },
  {
    place_id: 'demo_3',
    description: '789 Calle Loíza, Carolina, PR 00979',
    geometry: {
      location: { lat: 18.3951, lng: -66.0764 }
    }
  },
  {
    place_id: 'demo_4',
    description: '321 Ave. Hostos, Mayagüez, PR 00680',
    geometry: {
      location: { lat: 18.0078, lng: -66.6140 }
    }
  },
  {
    place_id: 'demo_5',
    description: '654 Ave. Las Américas, Ponce, PR 00716',
    geometry: {
      location: { lat: 17.9714, lng: -66.2266 }
    }
  }
];

export const getDemoAddressSuggestion = (query: string) => {
  if (!query || query.length < 2) return [];
  
  return demoAddressSuggestions.filter(suggestion =>
    suggestion.description.toLowerCase().includes(query.toLowerCase())
  );
};
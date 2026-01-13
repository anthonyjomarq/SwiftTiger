import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsScript } from '@/shared/utils/googleMaps';
import { Customer } from '@/shared/types/business';
import { useDemoMode } from '@/demo/contexts/DemoModeContext';
import { getDemoAddressSuggestion } from '@/demo/data/demoData';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  addressPlaceId: string;
  addressLatitude: number | null;
  addressLongitude: number | null;
}

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
  loading: boolean;
}

interface GooglePlaceResult {
  place_id?: string;
  formatted_address?: string;
  name?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface GoogleAutocomplete {
  getPlace: () => GooglePlaceResult;
  addListener: (eventName: string, handler: () => void) => void;
}

// Google Maps types moved to types/api.ts

export function CustomerForm({ customer, onSubmit, onCancel, loading }: CustomerFormProps) {
  const { isDemoMode } = useDemoMode();
  const [addressSearch, setAddressSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceResult | null>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CustomerFormData>(() => {
    if (customer) {
      return {
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        addressStreet: customer.addressStreet || '',
        addressCity: customer.addressCity || '',
        addressState: customer.addressState || '',
        addressZipCode: customer.addressZipCode || '',
        addressCountry: customer.addressCountry || 'USA',
        addressPlaceId: customer.addressPlaceId || '',
        addressLatitude: customer.addressLatitude || null,
        addressLongitude: customer.addressLongitude || null,
      };
    }
    return {
      name: '',
      email: '',
      phone: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
      addressCountry: 'USA',
      addressPlaceId: '',
      addressLatitude: null,
      addressLongitude: null,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for demo mode suggestions
  const [demoSuggestions, setDemoSuggestions] = useState<any[]>([]);
  const [showDemoSuggestions, setShowDemoSuggestions] = useState(false);

  // Initialize Google Places Autocomplete or demo mode
  useEffect(() => {
    if (isDemoMode) {
      // Demo mode - no Google API needed
      return;
    }

    const initializeAutocomplete = async (): Promise<void> => {
      try {
        await loadGoogleMapsScript();
        
        if (inputRef.current && window.google && window.google.maps && window.google.maps.places) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'pr' }, // Restrict to Puerto Rico
            fields: ['place_id', 'formatted_address', 'address_components', 'geometry', 'name']
            // No types restriction = includes addresses, establishments, and POIs
          });

          autocompleteRef.current?.addListener('place_changed', handlePlaceSelect);
        } else {
          throw new Error('Google Maps Places API not available');
        }
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        alert(`Failed to load Google Maps: ${(error as Error).message}`);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isDemoMode]);

  // Handle demo address selection
  const handleDemoAddressSelect = (suggestion: any) => {
    setSelectedPlace(suggestion);
    setAddressSearch(suggestion.description);
    setShowDemoSuggestions(false);
    
    // Parse demo address
    const parts = suggestion.description.split(', ');
    const street = parts[0] || '';
    const city = parts[1] || 'San Juan';
    const state = 'PR';
    const zipCode = parts[2]?.match(/\d{5}$/)?.[0] || '00901';
    
    setFormData(prevData => ({
      ...prevData,
      addressStreet: street,
      addressCity: city,
      addressState: state,
      addressZipCode: zipCode,
      addressCountry: 'US',
      addressPlaceId: suggestion.place_id,
      addressLatitude: suggestion.geometry.location.lat,
      addressLongitude: suggestion.geometry.location.lng,
    }));
  };

  // Handle demo address input
  const handleDemoAddressInput = (value: string) => {
    setAddressSearch(value);
    
    // Update form data with manual address entry
    setFormData(prevData => ({
      ...prevData,
      addressStreet: value,
    }));
    
    if (value.length >= 2) {
      const suggestions = getDemoAddressSuggestion(value);
      setDemoSuggestions(suggestions);
      setShowDemoSuggestions(suggestions.length > 0);
    } else {
      setShowDemoSuggestions(false);
    }
  };

  const handlePlaceSelect = (): void => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    
    if (!place.place_id) {
      console.error('No place selected');
      return;
    }

    setSelectedPlace(place);
    setAddressSearch(place.formatted_address || place.name || '');

    // Parse address components (handle cases where some might be missing)
    const addressComponents: Record<string, string> = {};
    
    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          addressComponents.streetNumber = component.long_name;
        }
        if (types.includes('route')) {
          addressComponents.route = component.long_name;
        }
        if (types.includes('subpremise')) {
          addressComponents.subpremise = component.long_name;
        }
        if (types.includes('locality')) {
          addressComponents.city = component.long_name;
        }
        if (types.includes('sublocality_level_1')) {
          addressComponents.sublocality = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          addressComponents.state = component.short_name;
        }
        if (types.includes('postal_code')) {
          addressComponents.zipCode = component.long_name;
        }
        if (types.includes('country')) {
          addressComponents.country = component.short_name;
        }
      });
    }

    // Better address parsing for businesses and regular addresses
    let street = '';
    let city = '';
    let state = '';
    let zipCode = '';
    
    // Check if this is a business/establishment by looking at address components
    const isEstablishment = place.address_components?.some(component => 
      component.types.includes('establishment') || component.types.includes('point_of_interest')
    ) || (place.name && place.name !== place.formatted_address);
    
    if (isEstablishment && place.name) {
      // Use business name for establishments
      street = place.name;
      
      // Add street address if available (for businesses on streets)
      if (addressComponents.route) {
        const streetAddress = [addressComponents.streetNumber, addressComponents.route]
          .filter(Boolean)
          .join(' ');
        if (streetAddress) {
          street += `, ${streetAddress}`;
        }
      }
    } else {
      // For regular addresses
      street = [addressComponents.streetNumber, addressComponents.route]
        .filter(Boolean)
        .join(' ');
      
      // Add subpremise if available (like suite numbers)
      if (addressComponents.subpremise) {
        street += `, ${addressComponents.subpremise}`;
      }
    }

    // Better city parsing - use locality first, then sublocality as fallback
    if (addressComponents.city) {
      city = addressComponents.city;
    } else if (addressComponents.sublocality) {
      city = addressComponents.sublocality;
    }

    // For Puerto Rico, state should always be PR, not the city name
    state = 'PR';
    zipCode = addressComponents.zipCode || '';

    // Set form values
    setFormData(prevData => ({
      ...prevData,
      addressStreet: street || place.formatted_address || '',
      addressCity: city,
      addressState: state,
      addressZipCode: zipCode,
      addressCountry: addressComponents.country || 'US',
      addressPlaceId: place.place_id || '',
      addressLatitude: place.geometry?.location ? place.geometry.location.lat() : null,
      addressLongitude: place.geometry?.location ? place.geometry.location.lng() : null,
    }));
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^\S+@\S+$/i;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // In demo mode, allow addresses without Google Places selection
    if (!selectedPlace && !isDemoMode && !customer) {
      newErrors.address = 'Please select the address from the dropdown to ensure proper formatting';
    } else if (!selectedPlace && !isDemoMode && customer && !customer.addressStreet) {
      newErrors.address = 'Please select the address from the dropdown to ensure proper formatting';
    } else if (!formData.addressStreet.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string): void => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Set initial address search and selected place if editing
  useEffect(() => {
    if (customer && customer.addressStreet) {
      const fullAddress = [
        customer.addressStreet,
        customer.addressCity,
        customer.addressState,
        customer.addressZipCode
      ].filter(Boolean).join(', ');
      setAddressSearch(fullAddress);
      
      // Create a mock place object to mark as selected
      setSelectedPlace({
        place_id: customer.addressPlaceId || 'existing',
        formatted_address: fullAddress
      });
    }
  }, [customer]);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="input"
            placeholder="Customer name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="input"
            placeholder="customer@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="input"
          placeholder="(555) 123-4567"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={addressSearch}
            onChange={(e) => {
              const value = e.target.value;
              if (isDemoMode) {
                handleDemoAddressInput(value);
              } else {
                setAddressSearch(value);
              }
              // Clear address-related errors when user types
              if (errors.address) {
                setErrors(prevErrors => {
                  const newErrors = { ...prevErrors };
                  delete newErrors.address;
                  return newErrors;
                });
              }
            }}
            className="input pl-10"
            placeholder={isDemoMode ? "Start typing an address... (Demo Mode)" : "Start typing an address in Puerto Rico..."}
            required
          />
          
          {/* Demo mode suggestions dropdown */}
          {isDemoMode && showDemoSuggestions && demoSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {demoSuggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => handleDemoAddressSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                >
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{suggestion.description}</span>
                  </div>
                </button>
              ))}
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center text-xs text-blue-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Demo addresses only
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select an address from the dropdown suggestions
        </p>
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
        {!selectedPlace && addressSearch && !customer && !errors.address && (
          <p className="mt-1 text-sm text-amber-600">
            Please select a valid address from the dropdown
          </p>
        )}
        {!selectedPlace && customer && customer.addressStreet && !errors.address && (
          <p className="mt-1 text-sm text-amber-600">
            Please re-select the address from dropdown to ensure proper formatting.
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
}
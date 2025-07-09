import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsScript } from '../utils/googleMaps';

const CustomerForm = ({ customer, onSubmit, onCancel, loading }) => {
  const [addressSearch, setAddressSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: customer || {
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
    },
  });

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (inputRef.current && window.google && window.google.maps && window.google.maps.places) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'pr' }, // Restrict to Puerto Rico
            fields: ['place_id', 'formatted_address', 'address_components', 'geometry', 'name']
            // No types restriction = includes addresses, establishments, and POIs
          });

          autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
        } else {
          throw new Error('Google Maps Places API not available');
        }
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        alert(`Failed to load Google Maps: ${error.message}`);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.place_id) {
      console.error('No place selected');
      return;
    }

    setSelectedPlace(place);
    setAddressSearch(place.formatted_address || place.name);

    // Parse address components (handle cases where some might be missing)
    const addressComponents = {};
    
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
    setValue('addressStreet', street || place.formatted_address);
    setValue('addressCity', city);
    setValue('addressState', state);
    setValue('addressZipCode', zipCode);
    setValue('addressCountry', addressComponents.country || 'US');
    setValue('addressPlaceId', place.place_id || '');
    
    // Set coordinates if available
    if (place.geometry && place.geometry.location) {
      setValue('addressLatitude', place.geometry.location.lat());
      setValue('addressLongitude', place.geometry.location.lng());
    }
  };

  const handleFormSubmit = (data) => {
    // For editing customers, always require address re-selection to ensure proper formatting
    if (!selectedPlace) {
      alert('Please select the address from the dropdown to ensure proper formatting.');
      return;
    }
    
    onSubmit(data);
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="input"
            placeholder="Customer name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            className="input"
            placeholder="customer@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone *
        </label>
        <input
          {...register('phone', { required: 'Phone number is required' })}
          type="tel"
          className="input"
          placeholder="(555) 123-4567"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
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
            onChange={(e) => setAddressSearch(e.target.value)}
            className="input pl-10"
            placeholder="Start typing an address in Puerto Rico..."
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select an address from the dropdown suggestions
        </p>
        {!selectedPlace && addressSearch && !customer && (
          <p className="mt-1 text-sm text-amber-600">
            Please select a valid address from the dropdown
          </p>
        )}
        {!selectedPlace && customer && customer.addressStreet && (
          <p className="mt-1 text-sm text-amber-600">
            Please re-select the address from dropdown to ensure proper formatting.
          </p>
        )}
      </div>

      {/* Hidden fields for form data */}
      <input type="hidden" {...register('addressStreet')} />
      <input type="hidden" {...register('addressCity')} />
      <input type="hidden" {...register('addressState')} />
      <input type="hidden" {...register('addressZipCode')} />
      <input type="hidden" {...register('addressCountry')} />
      <input type="hidden" {...register('addressPlaceId')} />
      <input type="hidden" {...register('addressLatitude')} />
      <input type="hidden" {...register('addressLongitude')} />

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
};

export default CustomerForm;
import React, { useState, useEffect, useCallback } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import Button from "./ui/Button";

const CustomerForm = React.memo(
  ({ customer, onSubmit, onCancel, showBackButton = false, onBackClick }) => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
    const [addressInput, setAddressInput] = useState("");

    // Places Autocomplete for address (Puerto Rico only)
    const {
      ready: addressReady,
      value: addressValue,
      suggestions: { status: addressStatus, data: addressData },
      setValue: setAddressValue,
      clearSuggestions: clearAddressSuggestions,
    } = usePlacesAutocomplete({
      debounce: 300,
      requestOptions: {
        componentRestrictions: { country: "PR" },
      },
    });

    // Initialize form data when customer changes
    useEffect(() => {
      if (customer) {
        setFormData({
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
        });
        setAddressInput(customer.address || "");
      } else {
        setFormData({ name: "", email: "", phone: "", address: "" });
        setAddressInput("");
      }
    }, [customer]);

    // Handle form field changes
    const handleChange = useCallback((e) => {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }, []);

    // Handle input change for address
    const handleAddressInputChange = useCallback(
      (e) => {
        setAddressInput(e.target.value);
        setAddressValue(e.target.value);
        setFormData((prev) => ({ ...prev, address: e.target.value }));
      },
      [setAddressValue]
    );

    // Handle address selection
    const handleAddressSelect = useCallback(
      async (address) => {
        setAddressInput(address);
        setAddressValue(address, false);
        clearAddressSuggestions();
        setFormData((prev) => ({ ...prev, address }));
      },
      [setAddressValue, clearAddressSuggestions]
    );

    // Handle form submission
    const handleSubmit = useCallback(
      (e) => {
        e.preventDefault();
        onSubmit(formData);
      },
      [formData, onSubmit]
    );

    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {customer ? "Edit Customer" : "Add New Customer"}
          </h3>
          {showBackButton && (
            <Button variant="secondary" size="sm" onClick={onBackClick}>
              ← Back
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={addressInput}
                onChange={handleAddressInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter address"
                disabled={!addressReady}
              />

              {/* Address suggestions */}
              {addressStatus === "OK" && addressData.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-40 overflow-y-auto">
                  {addressData.map(({ description }, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer hover:bg-gray-100 px-3 py-2 text-sm border-b border-gray-100 last:border-b-0"
                      onClick={() => handleAddressSelect(description)}
                    >
                      {description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {customer ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </form>
      </div>
    );
  }
);

CustomerForm.displayName = "CustomerForm";

export default CustomerForm;

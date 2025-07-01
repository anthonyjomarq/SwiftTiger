import React from "react";
import Button from "./ui/Button";

const CustomerDetail = React.memo(
  ({ customer, onEdit, onDelete, canEdit = true, canDelete = true }) => {
    if (!customer) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-gray-500">
            <p>No customer selected</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {customer.name}
            </h2>
            <p className="text-sm text-gray-500">
              Customer since{" "}
              {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEdit(customer)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(customer.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            {customer.address ? (
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600 break-words">
                    {customer.address}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No address provided
              </p>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">Customer ID</p>
              <p className="text-gray-600">{customer.id}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Created</p>
              <p className="text-gray-600">
                {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Last Updated</p>
              <p className="text-gray-600">
                {customer.updated_at
                  ? new Date(customer.updated_at).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CustomerDetail.displayName = "CustomerDetail";

export default CustomerDetail;

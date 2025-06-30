const { updateCustomerCoordinates } = require("./geocoding");
const socketService = require("./socketService");
const customerRepository = require("../repositories/customerRepository");
const { handleError } = require("../utils/errors");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalServerErrorResponse,
} = require("../utils/apiResponse");

class CustomerService {
  constructor() {}

  /**
   * Get all customers with proper permissions
   */
  async getCustomers() {
    try {
      const result = await customerRepository.findAll();
      return successResponse(
        { customers: result.data },
        "Customers retrieved successfully"
      );
    } catch (error) {
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Get a specific customer by ID
   */
  async getCustomerById(customerId) {
    try {
      const result = await customerRepository.findById(customerId);
      return successResponse(
        { customer: result.data },
        "Customer retrieved successfully"
      );
    } catch (error) {
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 404
        ? notFoundResponse("Customer")
        : errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Create a new customer with validation and geocoding
   */
  async createCustomer(customerData) {
    try {
      const { name, email, phone, address } = customerData;

      // Create customer using repository
      const result = await customerRepository.create({
        name,
        email,
        phone,
        address,
      });

      const customer = result.data;

      // Geocode address in background if provided
      if (address) {
        updateCustomerCoordinates(customer.id, address).catch(console.error);
      }

      // Emit WebSocket event for new customer
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "customer_created", customer },
          null
        );
      }

      return successResponse(customer, "Customer created successfully", 201);
    } catch (error) {
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Update an existing customer with validation and geocoding
   */
  async updateCustomer(customerId, updateData) {
    try {
      const { name, email, phone, address } = updateData;

      // Get existing customer to check if address changed
      const existingResult = await customerRepository.findById(customerId);
      const existingCustomer = existingResult.data;

      // Update customer using repository
      const result = await customerRepository.update(customerId, {
        name,
        email,
        phone,
        address,
      });

      const updatedCustomer = result.data;

      // Geocode address in background if provided and changed
      if (address && address !== existingCustomer.address) {
        updateCustomerCoordinates(customerId, address).catch(console.error);
      }

      // Emit WebSocket event for customer update
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "customer_updated", customer: updatedCustomer },
          null
        );
      }

      return successResponse(updatedCustomer, "Customer updated successfully");
    } catch (error) {
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 404
        ? notFoundResponse("Customer")
        : errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Delete a customer with validation
   */
  async deleteCustomer(customerId) {
    try {
      // Delete customer using repository (includes job check)
      const result = await customerRepository.delete(customerId);

      // Emit WebSocket event for customer deletion
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "customer_deleted", customerId },
          null
        );
      }

      return successResponse(
        { message: "Customer deleted successfully" },
        "Customer deleted successfully"
      );
    } catch (error) {
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 404
        ? notFoundResponse("Customer")
        : errorResponse.statusCode === 409
        ? errorResponse(errorResponse.error, errorResponse.statusCode)
        : errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Manually geocode a customer's address
   */
  async geocodeCustomer(customerId) {
    try {
      // Get customer with current address using repository
      const customerResult = await customerRepository.findById(customerId);

      if (!customerResult.success) {
        return notFoundResponse("Customer");
      }

      const customer = customerResult.data;

      if (!customer.address) {
        return errorResponse("Customer has no address to geocode", 400);
      }

      // Geocode the address
      const geocodeResult = await updateCustomerCoordinates(
        customerId,
        customer.address
      );

      return successResponse(
        {
          message: "Address geocoded successfully",
          customer: geocodeResult,
        },
        "Address geocoded successfully"
      );
    } catch (error) {
      console.error("Manual geocoding error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Search customers by name or email
   */
  async searchCustomers(searchTerm) {
    try {
      const result = await customerRepository.search(searchTerm);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { customers: result.data },
        "Customer search completed successfully"
      );
    } catch (error) {
      console.error("Search customers error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    try {
      const result = await customerRepository.getStats();

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        result.data,
        "Customer statistics retrieved successfully"
      );
    } catch (error) {
      console.error("Get customer stats error:", error);
      return internalServerErrorResponse();
    }
  }
}

// Create singleton instance
const customerService = new CustomerService();
module.exports = customerService;

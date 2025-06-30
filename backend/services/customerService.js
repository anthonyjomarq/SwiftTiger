const { updateCustomerCoordinates } = require("./geocoding");
const socketService = require("./socketService");
const customerRepository = require("../repositories/customerRepository");
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

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { customers: result.data },
        "Customers retrieved successfully"
      );
    } catch (error) {
      console.error("Get customers error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get a specific customer by ID
   */
  async getCustomerById(customerId) {
    try {
      const result = await customerRepository.findById(customerId);

      if (!result.success) {
        return notFoundResponse("Customer");
      }

      return successResponse(
        { customer: result.data },
        "Customer retrieved successfully"
      );
    } catch (error) {
      console.error("Get customer by ID error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Create a new customer with validation and geocoding
   */
  async createCustomer(customerData) {
    try {
      const { name, email, phone, address } = customerData;

      // Validation
      if (!name) {
        return errorResponse("Customer name is required", 400);
      }

      // Create customer using repository
      const result = await customerRepository.create({
        name,
        email,
        phone,
        address,
      });

      if (!result.success) {
        return internalServerErrorResponse();
      }

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
      console.error("Create customer error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Update an existing customer with validation and geocoding
   */
  async updateCustomer(customerId, updateData) {
    try {
      const { name, email, phone, address } = updateData;

      // Check if customer exists and update using repository
      const existingResult = await customerRepository.findById(customerId);
      if (!existingResult.success) {
        return notFoundResponse("Customer");
      }

      const existingCustomer = existingResult.data;

      // Update customer using repository
      const result = await customerRepository.update(customerId, {
        name,
        email,
        phone,
        address,
      });

      if (!result.success) {
        return internalServerErrorResponse();
      }

      const updatedCustomer = result.data;

      // Geocode address in background if provided and changed
      if (address && address !== existingCustomer.rows[0].address) {
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
      console.error("Update customer error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Delete a customer with validation
   */
  async deleteCustomer(customerId) {
    try {
      // Delete customer using repository (includes job check)
      const result = await customerRepository.delete(customerId);

      if (!result.success) {
        if (result.error === "Cannot delete customer with associated jobs") {
          return errorResponse(
            "Cannot delete customer with associated jobs",
            400
          );
        }
        return notFoundResponse("Customer");
      }

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
      console.error("Delete customer error:", error);
      return internalServerErrorResponse();
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

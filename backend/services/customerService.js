const { pool } = require("../database");
const { updateCustomerCoordinates } = require("./geocoding");
const socketService = require("./socketService");

class CustomerService {
  constructor() {}

  /**
   * Get all customers with proper permissions
   */
  async getCustomers() {
    try {
      const result = await pool.query(
        "SELECT * FROM customers ORDER BY created_at DESC"
      );

      return {
        success: true,
        data: { customers: result.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get customers error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get a specific customer by ID
   */
  async getCustomerById(customerId) {
    try {
      const result = await pool.query("SELECT * FROM customers WHERE id = $1", [
        customerId,
      ]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Customer not found",
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: { customer: result.rows[0] },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get customer by ID error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
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
        return {
          success: false,
          error: "Customer name is required",
          statusCode: 400,
        };
      }

      // Create customer
      const result = await pool.query(
        "INSERT INTO customers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, email, phone, address]
      );

      const customer = result.rows[0];

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

      return {
        success: true,
        data: customer,
        statusCode: 201,
      };
    } catch (error) {
      console.error("Create customer error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Update an existing customer with validation and geocoding
   */
  async updateCustomer(customerId, updateData) {
    try {
      const { name, email, phone, address } = updateData;

      // Check if customer exists
      const existingCustomer = await pool.query(
        "SELECT * FROM customers WHERE id = $1",
        [customerId]
      );

      if (existingCustomer.rows.length === 0) {
        return {
          success: false,
          error: "Customer not found",
          statusCode: 404,
        };
      }

      // Update customer
      const result = await pool.query(
        "UPDATE customers SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 RETURNING *",
        [name, email, phone, address, customerId]
      );

      const updatedCustomer = result.rows[0];

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

      return {
        success: true,
        data: updatedCustomer,
        statusCode: 200,
      };
    } catch (error) {
      console.error("Update customer error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Delete a customer with validation
   */
  async deleteCustomer(customerId) {
    try {
      // Check if customer has associated jobs
      const jobsCheck = await pool.query(
        "SELECT COUNT(*) as job_count FROM jobs WHERE customer_id = $1",
        [customerId]
      );

      if (parseInt(jobsCheck.rows[0].job_count) > 0) {
        return {
          success: false,
          error: "Cannot delete customer with associated jobs",
          statusCode: 400,
        };
      }

      const result = await pool.query(
        "DELETE FROM customers WHERE id = $1 RETURNING *",
        [customerId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Customer not found",
          statusCode: 404,
        };
      }

      // Emit WebSocket event for customer deletion
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "customer_deleted", customerId },
          null
        );
      }

      return {
        success: true,
        data: { message: "Customer deleted successfully" },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Delete customer error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Manually geocode a customer's address
   */
  async geocodeCustomer(customerId) {
    try {
      // Get customer with current address
      const customerResult = await pool.query(
        "SELECT * FROM customers WHERE id = $1",
        [customerId]
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          error: "Customer not found",
          statusCode: 404,
        };
      }

      const customer = customerResult.rows[0];

      if (!customer.address) {
        return {
          success: false,
          error: "Customer has no address to geocode",
          statusCode: 400,
        };
      }

      // Geocode the address
      const geocodeResult = await updateCustomerCoordinates(
        customerId,
        customer.address
      );

      return {
        success: true,
        data: {
          message: "Address geocoded successfully",
          customer: geocodeResult,
        },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Manual geocoding error:", error);
      return {
        success: false,
        error: "Geocoding failed",
        statusCode: 500,
      };
    }
  }

  /**
   * Search customers by name or email
   */
  async searchCustomers(searchTerm) {
    try {
      const result = await pool.query(
        `SELECT * FROM customers 
         WHERE name ILIKE $1 OR email ILIKE $1 
         ORDER BY name`,
        [`%${searchTerm}%`]
      );

      return {
        success: true,
        data: { customers: result.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Search customers error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    try {
      const totalCustomers = await pool.query(
        "SELECT COUNT(*) as total FROM customers"
      );
      const customersWithJobs = await pool.query(
        "SELECT COUNT(DISTINCT customer_id) as total FROM jobs WHERE customer_id IS NOT NULL"
      );
      const customersWithCoordinates = await pool.query(
        "SELECT COUNT(*) as total FROM customers WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
      );

      return {
        success: true,
        data: {
          totalCustomers: parseInt(totalCustomers.rows[0].total),
          customersWithJobs: parseInt(customersWithJobs.rows[0].total),
          customersWithCoordinates: parseInt(
            customersWithCoordinates.rows[0].total
          ),
        },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get customer stats error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }
}

// Create singleton instance
const customerService = new CustomerService();
module.exports = customerService;

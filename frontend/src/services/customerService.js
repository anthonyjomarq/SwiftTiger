import BaseApi from "./baseApi.js";
import { API_ENDPOINTS } from "../config/constants";

/**
 * @typedef {Object} CustomerData
 * @property {string} firstName - Customer's first name
 * @property {string} lastName - Customer's last name
 * @property {string} email - Customer's email address
 * @property {string} phone - Customer's phone number
 * @property {string} [company] - Customer's company name
 * @property {string} [address] - Customer's address
 * @property {string} [city] - Customer's city
 * @property {string} [state] - Customer's state/province
 * @property {string} [zipCode] - Customer's zip/postal code
 * @property {string} [country] - Customer's country
 * @property {Object} [coordinates] - Customer's coordinates {lat, lng}
 * @property {string} [notes] - Additional customer notes
 * @property {string} [preferredContact] - Preferred contact method (email, phone, sms)
 */

/**
 * @typedef {Object} CustomerUpdateData
 * @property {string} [firstName] - Customer's first name
 * @property {string} [lastName] - Customer's last name
 * @property {string} [email] - Customer's email address
 * @property {string} [phone] - Customer's phone number
 * @property {string} [company] - Customer's company name
 * @property {string} [address] - Customer's address
 * @property {string} [city] - Customer's city
 * @property {string} [state] - Customer's state/province
 * @property {string} [zipCode] - Customer's zip/postal code
 * @property {string} [country] - Customer's country
 * @property {Object} [coordinates] - Customer's coordinates
 * @property {string} [notes] - Additional customer notes
 * @property {string} [preferredContact] - Preferred contact method
 */

/**
 * @typedef {Object} CustomerFilters
 * @property {string} [search] - Search in name, email, phone, or company
 * @property {string} [city] - Filter by city
 * @property {string} [state] - Filter by state
 * @property {string} [country] - Filter by country
 * @property {boolean} [hasActiveJobs] - Filter customers with active jobs
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Number of items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {string} [sortOrder] - Sort order (asc, desc)
 */

/**
 * Customer service for handling customer-related API operations
 * @class CustomerService
 * @extends BaseApi
 */
class CustomerService extends BaseApi {
  /**
   * Create a new CustomerService instance
   * @param {Object} config - Configuration for the API instance
   */
  constructor(config = {}) {
    super(config);
  }

  /**
   * Get all customers with optional filtering and pagination
   * @param {CustomerFilters} params - Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated list of customers
   * @throws {Error} When customer retrieval fails
   */
  async getAll(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: API_ENDPOINTS.CUSTOMERS.LIST,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Customer details
   * @throws {Error} When customer retrieval fails
   */
  async getById(id) {
    try {
      const response = await this.request({
        method: "GET",
        url: API_ENDPOINTS.CUSTOMERS.GET.replace(":id", id),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new customer
   * @param {CustomerData} customerData - Customer data to create
   * @returns {Promise<Object>} Created customer details
   * @throws {Error} When customer creation fails
   */
  async create(customerData) {
    try {
      const response = await this.request({
        method: "POST",
        url: API_ENDPOINTS.CUSTOMERS.CREATE,
        data: customerData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing customer
   * @param {string} id - Customer ID
   * @param {CustomerUpdateData} customerData - Updated customer data
   * @returns {Promise<Object>} Updated customer details
   * @throws {Error} When customer update fails
   */
  async update(id, customerData) {
    try {
      const response = await this.request({
        method: "PUT",
        url: API_ENDPOINTS.CUSTOMERS.UPDATE.replace(":id", id),
        data: customerData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a customer
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Deletion confirmation
   * @throws {Error} When customer deletion fails
   */
  async delete(id) {
    try {
      const response = await this.request({
        method: "DELETE",
        url: API_ENDPOINTS.CUSTOMERS.DELETE.replace(":id", id),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search customers by text
   * @param {string} searchTerm - Search term
   * @param {CustomerFilters} params - Additional query parameters
   * @returns {Promise<Object>} Search results
   * @throws {Error} When search fails
   */
  async search(searchTerm, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/customers/search",
        params: {
          ...params,
          q: searchTerm,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get customers by location
   * @param {string} city - City to filter by
   * @param {string} [state] - State to filter by
   * @param {CustomerFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of customers in location
   * @throws {Error} When customer retrieval fails
   */
  async getByLocation(city, state = null, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/customers/location",
        params: {
          ...params,
          city,
          ...(state && { state }),
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get customers with active jobs
   * @param {CustomerFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of customers with active jobs
   * @throws {Error} When customer retrieval fails
   */
  async getWithActiveJobs(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/customers/active-jobs",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get customer statistics
   * @param {Object} params - Query parameters for statistics
   * @returns {Promise<Object>} Customer statistics
   * @throws {Error} When statistics retrieval fails
   */
  async getStatistics(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/customers/statistics",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get customer's job history
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters for job history
   * @returns {Promise<Object>} Customer's job history
   * @throws {Error} When job history retrieval fails
   */
  async getJobHistory(customerId, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/customers/${customerId}/jobs`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update customer's contact preferences
   * @param {string} customerId - Customer ID
   * @param {Object} preferences - Contact preferences
   * @returns {Promise<Object>} Updated customer details
   * @throws {Error} When preferences update fails
   */
  async updateContactPreferences(customerId, preferences) {
    try {
      const response = await this.request({
        method: "PATCH",
        url: `/customers/${customerId}/preferences`,
        data: preferences,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate customer email address
   * @param {string} email - Email address to validate
   * @param {string} [excludeId] - Customer ID to exclude from validation
   * @returns {Promise<Object>} Validation result
   * @throws {Error} When validation fails
   */
  async validateEmail(email, excludeId = null) {
    try {
      const response = await this.request({
        method: "POST",
        url: API_ENDPOINTS.CUSTOMERS.VALIDATE_EMAIL,
        data: {
          email,
          ...(excludeId && { excludeId }),
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get customers by company
   * @param {string} company - Company name to filter by
   * @param {CustomerFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of customers from company
   * @throws {Error} When customer retrieval fails
   */
  async getByCompany(company, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/customers/company",
        params: {
          ...params,
          company,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
const customerService = new CustomerService();

export default customerService;

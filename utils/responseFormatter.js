/**
 * Format successful response
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted response object
 */
const successResponse = (message, data = null, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} errors - Additional error details
 * @returns {Object} - Formatted error response object
 */
const errorResponse = (message, statusCode = 400, errors = null) => {
  return {
    success: false,
    message,
    statusCode,
    errors
  };
};

module.exports = {
  successResponse,
  errorResponse
};
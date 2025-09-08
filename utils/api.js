/**
 * Inject Magic API Utility
 * Provides easy methods to make POST requests to api.injectmagic.com/sisyphus/*
 */

class InjectMagicAPI {
  constructor() {
    this.baseUrl = "https://api.injectmagic.com/sisyphus";
  }

  get apiKey() {
    return process.env.INJECT_MAGIC_API_KEY;
  }

  /**
   * Make a POST request to an Inject Magic endpoint
   * @param {string} endpoint - The endpoint path (without /sisyphus/)
   * @param {object} data - The data to send in the request body
   * @param {object} options - Additional fetch options
   * @returns {Promise<object>} The response data
   */
  async post(endpoint, data = {}, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error("INJECT_MAGIC_API_KEY is required but not provided");
      }

      const url = `${this.baseUrl}/${endpoint.replace(/^\//, "")}`;

      const defaultOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
          ...options.headers,
        },
        body: JSON.stringify(data),
      };

      const mergedOptions = { ...defaultOptions, ...options };
      delete mergedOptions.body; // Remove body from spread to avoid conflicts
      mergedOptions.body = JSON.stringify(data);

      console.log(`Making POST request to: ${url}`);

      const response = await fetch(url, mergedOptions);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      console.error(`Inject Magic API Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: error.status || 500,
      };
    }
  }

  /**
   * Helper function to post an action to the Inject Magic API
   * @param {string} text - The action text to post
   * @returns {Promise<object>} The response data
   */
  async postAction(text) {
    return this.post("actions/", { text });
  }

  /**
   * Helper function to replace the memory to the Inject Magic API
   * @param {string} memory - The memory to replace
   * @returns {Promise<object>} The response data
   */
  async replaceMemory(memory) {
    return this.post("memory/", { memory });
  }

  /**
   * Helper function to whitelist a token with the Inject Magic API
   * @param {string} mintAddress - The mint address to whitelist
   * @returns {Promise<object>} The response data
   */
  async whitelistToken(mint) {
    return this.post("whitelisted-tokens/", { tokenMint: mint });
  }

  async getWhitelistedTokens() {
    const response = await fetch(
      "https://api.injectmagic.com/sisyphus/whitelisted-tokens/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Inject Magic API error: ${response.status}`);
    }
    const arr = await response.json();
    const tokens = arr.map((token) => token.tokenMint);
    return tokens;
  }

  async getMemory() {
    const response = await fetch(
      "https://api.injectmagic.com/sisyphus/memory/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Inject Magic API error: ${response.status}`);
    }
    const arr = await response.json();
    const memory = arr.memory;
    return memory;
  }
}

// Create and export a singleton instance
const injectMagicAPI = new InjectMagicAPI();

export default injectMagicAPI;

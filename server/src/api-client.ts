/**
 * API client for working with external APIs
 * 
 * Uses built-in fetch API (Node.js 18+)
 * For Node.js < 18 install: npm install undici
 */

// Use global types from DOM lib
/// <reference lib="dom" />

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string; // Static API key for 'api-key' header
  authToken?: string; // Bearer token for 'authorization' header
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class ApiClient {
  private config: {
    baseUrl: string;
    apiKey: string;
    headers: Record<string, string>;
    timeout: number;
  };
  private authToken: string | null = null; // Dynamic auth token stored in memory

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || "",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      timeout: config.timeout || 30000,
    };

    // Add static API key header if present
    if (config.apiKey) {
      this.config.headers["api-key"] = config.apiKey;
    }

    // Add Bearer token for authorization if present (from env or set dynamically)
    if (config.authToken) {
      this.authToken = config.authToken;
      this.config.headers["Authorization"] = `Bearer ${config.authToken}`;
    }
  }

  /**
   * Sets or updates the authentication token dynamically
   * Use this after patient authorization to store the token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      this.config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.config.headers["Authorization"];
    }
  }

  /**
   * Gets the current authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Performs GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, { method: "GET" });
  }

  /**
   * Performs POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Performs PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Performs DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, { method: "DELETE" });
  }

  /**
   * Performs PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Build URL with parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Performs HTTP request
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const headers: Record<string, string> = {};
      response.headers.forEach((value: string, key: string) => {
        headers[key] = value;
      });

      let data: T;
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`
        );
      }

      return {
        data,
        status: response.status,
        headers,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      
      throw error;
    }
  }
}

/**
 * Creates API client from environment variables configuration
 */
export function createApiClient(): ApiClient {
  const baseUrl = process.env.API_BASE_URL || "https://api.example.com";
  const apiKey = process.env.API_KEY || ""; // Static API key for 'api-key' header
  const authToken = process.env.AUTH_TOKEN || ""; // Bearer token for 'authorization' header

  return new ApiClient({
    baseUrl,
    apiKey,
    authToken,
    headers: {
      "User-Agent": "MCP-Server/1.0.0",
    },
    timeout: parseInt(process.env.API_TIMEOUT || "30000", 10),
  });
}


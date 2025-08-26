// import { AxiosRequestConfig } from 'axios';

// API Configuration types
export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Generic API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message: string;
}

// Google Maps types
export interface GoogleMapsConfig {
  apiKey: string;
  libraries?: string[];
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: any;
        Map?: any;
        Marker?: any;
        [key: string]: any;
      };
      [key: string]: any;
    };
  }
}
// API Client - Enterprise-grade service layer for backend integration
import type {
  BankRequestDTO,
  BankResponseDTO,
  CustomerRequestDTO,
  CustomerResponseDTO,
  AccountRequestDTO,
  AccountResponseDTO,
  AccountComplianceUpdateRequestDTO,
  TransactionRequestDTO,
  TransactionResponseDTO,
  UpiRegisterRequestDTO,
  UpiPayRequestDTO,
  UpiProfileResponseDTO,
} from "@/types/api";

// Base configuration - update this when connecting to real backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

// Generic fetch wrapper with timeout and error handling
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Get token from localStorage
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    clearTimeout(id);
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new ApiError(401, "Unauthorized");
    }
    
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "Request Timeout");
    }
    throw error;
  }
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Generic API request for binary responses (e.g., QR codes)
async function apiRequestBlob(
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  return response.blob();
}

// ============= Bank API =============
export const bankApi = {
  getAll: () => apiRequest<BankResponseDTO[]>("/bank"),
  
  getById: (id: string) => apiRequest<BankResponseDTO>(`/bank/${id}`),
  
  create: (data: BankRequestDTO) =>
    apiRequest<BankResponseDTO>("/bank/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: BankRequestDTO) =>
    apiRequest<BankResponseDTO>(`/bank/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<void>(`/bank/${id}`, {
      method: "DELETE",
    }),
};

// ============= Customer API =============
export const customerApi = {
  getAll: () => apiRequest<CustomerResponseDTO[]>("/customer"),
  
  getMe: () => apiRequest<CustomerResponseDTO>("/customer/me"),
  
  getByEmail: (email: string) =>
    apiRequest<CustomerResponseDTO>(`/customer/email/${encodeURIComponent(email)}`),
  
  getByBank: (bankName: string) => 
    apiRequest<CustomerResponseDTO[]>(`/customer/bank?bankName=${encodeURIComponent(bankName)}`),
  
  search: (name: string, bankName: string) =>
    apiRequest<CustomerResponseDTO[]>(`/customer/search?name=${encodeURIComponent(name)}&bankName=${encodeURIComponent(bankName)}`),
  
  update: (name: string, email: string, phoneNumber: string, data: CustomerRequestDTO) =>
    apiRequest<CustomerResponseDTO>(`/customer/update?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phoneNumber=${encodeURIComponent(phoneNumber)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<CustomerResponseDTO>(`/customer/delete?id=${id}`, {
      method: "DELETE",
    }),
};

// ============= Account API =============
export const accountApi = {
  getAll: () => apiRequest<AccountResponseDTO[]>("/account"),
  
  getMy: () => apiRequest<AccountResponseDTO[]>("/account/my"),
  
  getById: (id: string) =>
    apiRequest<AccountResponseDTO>(`/account/${id}`),
  
  getByBankName: (bankName: string) =>
    apiRequest<AccountResponseDTO[]>(`/account/name/${encodeURIComponent(bankName)}`),
  
  getByEmail: (email: string) =>
    apiRequest<AccountResponseDTO[]>(`/account/email/${encodeURIComponent(email)}`),
  
  create: (bankName: string, data: AccountRequestDTO) =>
    apiRequest<AccountResponseDTO>(`/account/${encodeURIComponent(bankName)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (accNumber: string, data: AccountRequestDTO) =>
    apiRequest<AccountResponseDTO>(`/account/${accNumber}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateCompliance: (accNumber: string, data: AccountComplianceUpdateRequestDTO) =>
    apiRequest<AccountResponseDTO>(`/account/${accNumber}/compliance`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  delete: (accNumber: string) =>
    apiRequest<AccountResponseDTO>(`/account/${accNumber}`, {
      method: "DELETE",
    }),
};

// ============= Transaction API =============
export const transactionApi = {
  getAll: () => apiRequest<TransactionResponseDTO[]>("/transaction/all"),
  
  getMy: () => apiRequest<TransactionResponseDTO[]>("/transaction/my"),
  
  getByAccount: (accountNumber: string, email: string) =>
    apiRequest<TransactionResponseDTO[]>(`/transaction?accountNumber=${encodeURIComponent(accountNumber)}&email=${encodeURIComponent(email)}`),
  
  getBalance: (id: number) =>
    apiRequest<number>(`/transaction/accounts/${id}/balance`),
  
  create: (data: TransactionRequestDTO) =>
    apiRequest<TransactionResponseDTO>("/transaction", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============= UPI API =============
export const upiApi = {
  getAll: () => apiRequest<UpiProfileResponseDTO[]>("/upi"),

  getMy: () => apiRequest<UpiProfileResponseDTO[]>("/upi/my"),
  
  getProfile: (upiId: string) =>
    apiRequest<UpiProfileResponseDTO>(`/upi/${encodeURIComponent(upiId)}`),
  
  getByAccountNumber: (accountNumber: string) =>
    apiRequest<UpiProfileResponseDTO[]>(`/upi/account/${encodeURIComponent(accountNumber)}`),
  
  register: (data: UpiRegisterRequestDTO) =>
    apiRequest<UpiProfileResponseDTO>("/upi/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  pay: (data: UpiPayRequestDTO) =>
    apiRequest<TransactionResponseDTO>("/upi/pay", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  updateStatus: (upiId: string, status: string) =>
    apiRequest<UpiProfileResponseDTO>(`/upi/${encodeURIComponent(upiId)}/status?status=${status}`, {
      method: "PATCH",
    }),
  
  delete: (upiId: string) =>
    apiRequest<void>(`/upi/${encodeURIComponent(upiId)}`, {
      method: "DELETE",
    }),
};

// ============= QR API =============
export const qrApi = {
  generateUpi: (params: { upiId: string; name?: string; amount?: string | number; width?: number; height?: number }) => {
    const search = new URLSearchParams({
      upiId: params.upiId,
      width: String(params.width ?? 400),
      height: String(params.height ?? 400),
    });
    if (params.name) search.set("name", params.name);
    if (params.amount !== undefined && params.amount !== "") search.set("amount", String(params.amount));
    return apiRequestBlob(`/qr/generate?${search.toString()}`);
  },
};

// ============= Audit API (for compliance) =============
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "LOGIN" | "LOGOUT" | "EXPORT";
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "SUCCESS" | "FAILED";
}

export const auditApi = {
  getLogs: (params?: { 
    startDate?: string; 
    endDate?: string; 
    action?: string;
    userId?: string;
    resource?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.action) searchParams.set("action", params.action);
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.resource) searchParams.set("resource", params.resource);
    
    const query = searchParams.toString();
    return apiRequest<AuditLogEntry[]>(`/audit/logs${query ? `?${query}` : ""}`);
  },
  
  getLogById: (id: string) => apiRequest<AuditLogEntry>(`/audit/logs/${id}`),
};

// ============= Security API =============
export interface SessionInfo {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  eventType: "LOGIN" | "LOGOUT" | "FAILED_LOGIN" | "PASSWORD_CHANGE" | "MFA_ENABLED" | "MFA_DISABLED";
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
}

export const securityApi = {
  getSessions: () => apiRequest<SessionInfo[]>("/security/sessions"),
  
  terminateSession: (sessionId: string) =>
    apiRequest<void>(`/security/sessions/${sessionId}`, {
      method: "DELETE",
    }),
  
  terminateAllSessions: (excludeCurrent?: boolean) =>
    apiRequest<void>(`/security/sessions/terminate-all`, {
      method: "POST",
      body: JSON.stringify({ excludeCurrent }),
    }),
  
  getAccessLogs: (params?: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.eventType) searchParams.set("eventType", params.eventType);
    
    const query = searchParams.toString();
    return apiRequest<AccessLogEntry[]>(`/security/access-logs${query ? `?${query}` : ""}`);
  },
};

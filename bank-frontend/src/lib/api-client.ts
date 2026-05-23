// API Client - Enterprise-grade service layer for backend integration
import type {
  BankRequestDTO,
  BankResponseDTO,
  CustomerRequestDTO,
  CustomerResponseDTO,
  AccountRequestDTO,
  AccountResponseDTO,
  ReceiverValidationResponseDTO,
  AccountComplianceUpdateRequestDTO,
  TransactionRequestDTO,
  TransactionResponseDTO,
  UpiRegisterRequestDTO,
  UpiPayRequestDTO,
  UpiProfileResponseDTO,
} from "@/types/api";

// Base configuration - update this when connecting to real backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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

export interface AuthUserProfileResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  primaryRole?: string;
  isActive?: boolean | null;
  isLocked?: boolean | null;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;

  customerId?: string;
  customerStatus?: string;
  kycStatus?: string;
  age?: number;
  address?: string;

  accountCount?: number;
  totalBalance?: number;
  transactionCount?: number;
  upiProfileCount?: number;

  managedBankCount?: number;
  managedCustomerCount?: number;
  managedAccountCount?: number;
  managedTransactionCount?: number;
  managedUpiProfileCount?: number;
  pendingKycCount?: number;

  activeSessionCount?: number;
  failedLoginCount?: number;
  auditSuccessCount?: number;
  auditFailureCount?: number;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  expiresAt?: string;
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

// ============= Auth API =============
export const authApi = {
  getCurrentUser: () => apiRequest<AuthUserProfileResponse>("/auth/me"),
  requestPasswordReset: (identifier: string) =>
    apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),
  logout: (refreshToken?: string) =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    }),
  resetPassword: (token: string, newPassword: string) =>
    apiRequest<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
};

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

  validateReceiver: (params: { bankName: string; ifscCode: string; holderName: string }) =>
    apiRequest<ReceiverValidationResponseDTO>(
      `/account/validate-receiver?bankName=${encodeURIComponent(params.bankName)}&ifscCode=${encodeURIComponent(params.ifscCode)}&holderName=${encodeURIComponent(params.holderName)}`
    ),

  lookupByAccountNumber: (accountNumber: string) =>
    apiRequest<ReceiverValidationResponseDTO>(
      `/account/lookup-by-number?accountNumber=${encodeURIComponent(accountNumber)}`
    ),
  
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

  exportStatement: (
    accountNumber: string,
    format: "csv" | "pdf",
    from?: string,
    to?: string
  ) => {
    const params = new URLSearchParams({ format });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiRequestBlob(`/accounts/${encodeURIComponent(accountNumber)}/statement?${params.toString()}`);
  },
};

// ============= Transaction API =============
export const transactionApi = {
  getAll: () => apiRequest<TransactionResponseDTO[]>("/transaction/all"),
  
  getMy: () => apiRequest<TransactionResponseDTO[]>("/transaction/my"),
  
  getByAccount: (accountNumber: string, email: string) =>
    apiRequest<TransactionResponseDTO[]>(`/transaction?accountNumber=${encodeURIComponent(accountNumber)}&email=${encodeURIComponent(email)}`),

  getByCustomer: (customerId: string) =>
    apiRequest<TransactionResponseDTO[]>(`/transaction/customer/${encodeURIComponent(customerId)}`),
  
  getBalance: (id: number) =>
    apiRequest<number>(`/transaction/accounts/${id}/balance`),
  
  create: (data: TransactionRequestDTO) =>
    apiRequest<TransactionResponseDTO>("/transaction", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  reverse: (transactionId: number, reason?: string) => {
    const params = new URLSearchParams();
    if (reason) params.set("reason", reason);
    const query = params.toString();
    return apiRequest<TransactionResponseDTO>(
      `/transaction/${transactionId}/reverse${query ? `?${query}` : ""}`,
      {
        method: "POST",
      }
    );
  },
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

// ============= Composite API (Phase 1) =============
export const compositeApi = {
  getMyOverview: () =>
    apiRequest<{
      accounts: import("@/types/api").AccountResponseDTO[];
      totalBalance: number;
      totalAccounts: number;
      recentTransactions: import("@/types/api").TransactionResponseDTO[];
      totalTransactions: number;
      upiProfiles: import("@/types/api").UpiProfileResponseDTO[];
      activeUpiProfiles: number;
    }>("/composite/my/overview"),

  comprehensiveTransfer: (data: import("@/types/api").TransactionRequestDTO) =>
    apiRequest<{
      transaction: import("@/types/api").TransactionResponseDTO;
      senderNewBalance: number;
      receiverNewBalance: number;
      senderAccountNumber: string;
      receiverAccountNumber: string;
      processedAt: string;
      status: string;
    }>("/composite/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCustomerBankingProfile: (customerId: string) =>
    apiRequest<{
      customer: import("@/types/api").CustomerResponseDTO;
      accounts: import("@/types/api").AccountResponseDTO[];
      totalBalance: number;
      recentTransactions: import("@/types/api").TransactionResponseDTO[];
      totalTransactions: number;
      upiProfiles: import("@/types/api").UpiProfileResponseDTO[];
      totalAccounts: number;
    }>(`/composite/customers/${encodeURIComponent(customerId)}/banking-profile`),

  getBankOperationsSummary: (bankId: string) =>
    apiRequest<{
      bank: import("@/types/api").BankResponseDTO;
      totalAccounts: number;
      totalCustomers: number;
      totalBalance: number;
      totalTransactions: number;
      completedTransactions: number;
      reversedTransactions: number;
      failedTransactions: number;
    }>(`/composite/banks/${encodeURIComponent(bankId)}/operations-summary`),

  batchBalanceCheck: (accountNumbers: string[]) =>
    apiRequest<Array<{
      accountNumber: string;
      balance: number | null;
      bankName: string | null;
      status: string | null;
      errorMessage: string | null;
    }>>("/composite/accounts/balance-check", {
      method: "POST",
      body: JSON.stringify(accountNumbers),
    }),

  advancedTransactionSearch: (params: {
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
    status?: string;
    bankName?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo) query.set("dateTo", params.dateTo);
    if (params.amountMin !== undefined) query.set("amountMin", String(params.amountMin));
    if (params.amountMax !== undefined) query.set("amountMax", String(params.amountMax));
    if (params.status) query.set("status", params.status);
    if (params.bankName) query.set("bankName", params.bankName);
    return apiRequest<import("@/types/api").TransactionResponseDTO[]>(
      `/composite/transactions/advanced?${query.toString()}`
    );
  },

  globalSearch: (q: string) =>
    apiRequest<{
      query: string;
      customers: import("@/types/api").CustomerResponseDTO[];
      accounts: import("@/types/api").AccountResponseDTO[];
      transactions: import("@/types/api").TransactionResponseDTO[];
      totalResults: number;
    }>(`/composite/search/global?q=${encodeURIComponent(q)}`),

  freezeAccount: (accountNumber: string, reason?: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      resourceId: string;
      newStatus: string;
      performedAt: string;
      performedBy: string;
    }>(`/composite/accounts/${encodeURIComponent(accountNumber)}/freeze`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  kycVerify: (customerId: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      resourceId: string;
      newStatus: string;
      performedAt: string;
      performedBy: string;
    }>(`/composite/customers/${encodeURIComponent(customerId)}/kyc-verify`, {
      method: "POST",
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

export interface AuditLogsPageResponse {
  items: AuditLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const auditApi = {
  getLogs: (params?: { 
    startDate?: string; 
    endDate?: string; 
    action?: string;
    userId?: string;
    resource?: string;
    page?: number;
    size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.action) searchParams.set("action", params.action);
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.resource) searchParams.set("resource", params.resource);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.size) searchParams.set("size", String(params.size));
    
    const query = searchParams.toString();
    return apiRequest<AuditLogsPageResponse>(`/audit/logs${query ? `?${query}` : ""}`);
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

// ============= Webhook API =============
export interface WebhookSubscription {
  id: number;
  targetUrl: string;
  eventTypes: string;
  secret: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebhookCreateRequest {
  targetUrl: string;
  eventTypes: string;
  secret: string;
  description?: string;
}

export const webhookApi = {
  list: () => apiRequest<WebhookSubscription[]>("/webhooks"),
  create: (data: WebhookCreateRequest) =>
    apiRequest<WebhookSubscription>("/webhooks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  setActive: (id: number, active: boolean) =>
    apiRequest<WebhookSubscription>(`/webhooks/${id}/active?active=${active}`, {
      method: "PATCH",
    }),
  delete: (id: number) =>
    apiRequest<void>(`/webhooks/${id}`, {
      method: "DELETE",
    }),
};

// ============= Debit Card API =============
export interface DebitCardDTO {
  id?: number;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv?: string;
  cardType?: string;
  status?: string;
  isVirtual?: boolean;
  isContactlessEnabled?: boolean;
  isInternationalEnabled?: boolean;
  merchantCategoryBlocks?: string[];
  isLinkedToUpi?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  spentToday?: number;
  spentMonth?: number;
  accountId?: number;
  createdAt?: string;
  issueDate?: string;
  blockedDate?: string;
  blockedReason?: string;
  otpRequired?: boolean;
}

export const debitCardApi = {
  getByAccount: (accountId: number) =>
    apiRequest<DebitCardDTO[]>(`/debit-cards/account/${accountId}`),

  getByAccountNumber: (accountNumber: string) =>
    apiRequest<DebitCardDTO[]>(`/debit-cards/account-number/${encodeURIComponent(accountNumber)}`),
  
  getById: (cardId: number) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}`),
  
  toggleContactless: (cardId: number, enabled: boolean) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/toggle-contactless?enabled=${enabled}`, {
      method: "PUT",
    }),
  
  toggleInternational: (cardId: number, enabled: boolean) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/toggle-international?enabled=${enabled}`, {
      method: "PUT",
    }),

  toggleOtp: (cardId: number, enabled: boolean) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/toggle-otp?enabled=${enabled}`, {
      method: "PUT",
    }),

  updateLimits: (cardId: number, data: { dailyLimit?: number; monthlyLimit?: number }) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/limits`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateMerchantBlocks: (cardId: number, categories: string[]) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/merchant-blocks`, {
      method: "PUT",
      body: JSON.stringify({ categories }),
    }),

  freeze: (cardId: number, reason?: string) => {
    const params = new URLSearchParams();
    if (reason) params.set("reason", reason);
    const query = params.toString();
    return apiRequest<DebitCardDTO>(
      `/debit-cards/${cardId}/freeze${query ? `?${query}` : ""}`,
      { method: "POST" }
    );
  },

  unfreeze: (cardId: number) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/unfreeze`, { method: "POST" }),

  replace: (cardId: number) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/replace`, { method: "POST" }),
  
  blockCard: (cardId: number, reason: string) =>
    apiRequest<DebitCardDTO>(`/debit-cards/${cardId}/block?reason=${encodeURIComponent(reason)}`, {
      method: "PUT",
    }),
};

export interface DebitCardRequestDTO {
  id: number;
  accountId: number;
  accountNumber: string;
  requestedByUserId: number;
  requestedByName?: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  issuedCardId?: number;
  cardType?: string;
  isVirtual?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  otpRequired?: boolean;
  isContactlessEnabled?: boolean;
  isInternationalEnabled?: boolean;
  deliveryMethod?: string;
  deliveryAddress?: string;
  deliveryStatus?: string;
  trackingNumber?: string;
  expectedDeliveryDate?: string;
  issuedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  kycStatusAtRequest?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

export interface DebitCardRequestCreateRequest {
  accountNumber: string;
  cardType?: string;
  isVirtual?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  otpRequired?: boolean;
  isContactlessEnabled?: boolean;
  isInternationalEnabled?: boolean;
  deliveryMethod?: string;
  deliveryAddress?: string;
}

export interface DebitCardRequestDecisionRequest {
  dailyLimit?: number;
  monthlyLimit?: number;
  cardType?: string;
  isVirtual?: boolean;
  otpRequired?: boolean;
  isContactlessEnabled?: boolean;
  isInternationalEnabled?: boolean;
  deliveryMethod?: string;
  deliveryAddress?: string;
  trackingNumber?: string;
  expectedDeliveryDate?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

export const debitCardRequestApi = {
  create: (data: DebitCardRequestCreateRequest) =>
    apiRequest<DebitCardRequestDTO>("/debit-card-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listMy: () => apiRequest<DebitCardRequestDTO[]>("/debit-card-requests/my"),
  listPending: () => apiRequest<DebitCardRequestDTO[]>("/debit-card-requests/pending"),
  listApproved: () => apiRequest<DebitCardRequestDTO[]>("/debit-card-requests/approved"),
  listIssued: () => apiRequest<DebitCardRequestDTO[]>("/debit-card-requests/issued"),
  approve: (requestId: number, data: DebitCardRequestDecisionRequest) =>
    apiRequest<DebitCardRequestDTO>(`/debit-card-requests/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  reject: (requestId: number, data: DebitCardRequestDecisionRequest) =>
    apiRequest<DebitCardRequestDTO>(`/debit-card-requests/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  issue: (requestId: number) =>
    apiRequest<DebitCardRequestDTO>(`/debit-card-requests/${requestId}/issue`, {
      method: "POST",
    }),
  dispatch: (requestId: number, data: DebitCardRequestDecisionRequest) =>
    apiRequest<DebitCardRequestDTO>(`/debit-card-requests/${requestId}/dispatch`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deliver: (requestId: number) =>
    apiRequest<DebitCardRequestDTO>(`/debit-card-requests/${requestId}/deliver`, {
      method: "POST",
    }),
};

// ============= Credit Card API =============
export interface CreditCardDTO {
  id?: number;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv?: string;
  cardType?: string;
  status?: string;
  creditLimit?: number;
  availableCredit?: number;
  currentBalance?: number;
  minimumDue?: number;
  dueDate?: number;
  isContactlessEnabled?: boolean;
  isInternationalEnabled?: boolean;
  isLinkedToUpi?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  otpRequired?: boolean;
  rewardPoints?: number;
  cashbackPercentage?: number;
  merchantCategoryBlocks?: string[];
  planId?: number;
  planName?: string;
  planApr?: number;
  planAnnualFee?: number;
  planGracePeriodDays?: number;
  planLateFee?: number;
  accountId?: number;
  createdAt?: string;
  issueDate?: string;
  blockedDate?: string;
  blockedReason?: string;
}

export const creditCardApi = {
  getByAccount: (accountId: number) =>
    apiRequest<CreditCardDTO[]>(`/credit-cards/account/${accountId}`),

  getByAccountNumber: (accountNumber: string) =>
    apiRequest<CreditCardDTO[]>(`/credit-cards/account-number/${encodeURIComponent(accountNumber)}`),
  
  getById: (cardId: number) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}`),
  
  toggleContactless: (cardId: number, enabled: boolean) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/toggle-contactless?enabled=${enabled}`, {
      method: "PUT",
    }),
  
  toggleInternational: (cardId: number, enabled: boolean) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/toggle-international?enabled=${enabled}`, {
      method: "PUT",
    }),

  toggleOtp: (cardId: number, enabled: boolean) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/toggle-otp?enabled=${enabled}`, {
      method: "PUT",
    }),

  updateLimits: (cardId: number, data: { dailyLimit?: number; monthlyLimit?: number }) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/limits`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateMerchantBlocks: (cardId: number, categories: string[]) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/merchant-blocks`, {
      method: "PUT",
      body: JSON.stringify({ categories }),
    }),

  freeze: (cardId: number, reason?: string) => {
    const params = new URLSearchParams();
    if (reason) params.set("reason", reason);
    const query = params.toString();
    return apiRequest<CreditCardDTO>(
      `/credit-cards/${cardId}/freeze${query ? `?${query}` : ""}`,
      { method: "POST" }
    );
  },

  unfreeze: (cardId: number) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/unfreeze`, { method: "POST" }),

  replace: (cardId: number) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/replace`, { method: "POST" }),
  
  blockCard: (cardId: number, reason: string) =>
    apiRequest<CreditCardDTO>(`/credit-cards/${cardId}/block?reason=${encodeURIComponent(reason)}`, {
      method: "PUT",
    }),
};

// ============= Credit Plan API =============
export interface CreditPlanDTO {
  id?: number;
  name: string;
  description?: string;
  apr: number;
  annualFee: number;
  lateFee: number;
  gracePeriodDays: number;
  minLimit: number;
  maxLimit: number;
  cashbackPercentage: number;
  status?: string;
}

export const creditPlanApi = {
  list: () => apiRequest<CreditPlanDTO[]>("/credit-plans"),
  listAll: () => apiRequest<CreditPlanDTO[]>("/credit-plans/all"),
  create: (data: CreditPlanDTO) =>
    apiRequest<CreditPlanDTO>("/credit-plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<CreditPlanDTO>) =>
    apiRequest<CreditPlanDTO>(`/credit-plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  assignToCard: (planId: number, cardId: number) =>
    apiRequest<CreditPlanDTO>(`/credit-plans/${planId}/assign/${cardId}`, {
      method: "POST",
    }),
};

// ============= Loan API =============
export interface LoanDTO {
  id?: number;
  customerId?: string;
  accountId?: number;
  loanType: string;
  principalAmount?: number;
  loanAmount: number;
  outstandingAmount?: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate?: string;
  endDate?: string;
  nextEmiDate?: string;
  emisPaid?: number;
  emisRemaining?: number;
  status?: string;
  collateralDetails?: string;
  isForeclosureAllowed?: boolean;
  foreclosureCharges?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const loanApi = {
  getAll: () => apiRequest<LoanDTO[]>("/loans"),

  getByCustomer: (customerId: string) =>
    apiRequest<LoanDTO[]>(`/loans/customer/${encodeURIComponent(customerId)}`),

  getByAccount: (accountId: number) =>
    apiRequest<LoanDTO[]>(`/loans/account/${accountId}`),

  getById: (loanId: number) =>
    apiRequest<LoanDTO>(`/loans/${loanId}`),

  create: (data: LoanDTO) =>
    apiRequest<LoanDTO>("/loans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============= EMI API =============
export interface EMIDTO {
  id?: number;
  loanId?: number;
  emiNumber: number;
  emiAmount: number;
  dueDate?: string;
  paymentDate?: string;
  amountPaid?: number;
  principalComponent?: number;
  interestComponent?: number;
  penalties?: number;
  status?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const emiApi = {
  getByLoan: (loanId: number) =>
    apiRequest<EMIDTO[]>(`/emis/loan/${loanId}`),

  getById: (emiId: number) =>
    apiRequest<EMIDTO>(`/emis/${emiId}`),

  update: (emiId: number, data: EMIDTO) =>
    apiRequest<EMIDTO>(`/emis/${emiId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ============= Notification API =============
export interface NotificationDTO {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const notificationApi = {
  getAll: (page = 0, size = 20) =>
    apiRequest<PagedResponse<NotificationDTO>>(`/notifications?page=${page}&size=${size}`),

  getUnread: () =>
    apiRequest<NotificationDTO[]>("/notifications/unread"),

  getUnreadCount: () =>
    apiRequest<{ count: number }>("/notifications/unread/count"),

  markAsRead: (notificationId: number) =>
    apiRequest<void>(`/notifications/${notificationId}/read`, {
      method: "PUT",
    }),

  markAllAsRead: () =>
    apiRequest<void>("/notifications/read-all", {
      method: "PUT",
    }),
};

// ============= Transaction Receipt API =============
export interface TransactionReceiptDTO {
  receiptId: string;
  transactionId: number;
  transactionType: string;
  status: string;
  amount: number;
  currency: string;
  senderName: string;
  senderAccountNumber: string;
  senderBankName: string;
  senderIfsc: string;
  receiverName: string;
  receiverAccountNumber: string;
  receiverBankName: string;
  receiverIfsc: string;
  upiId?: string;
  description?: string;
  referenceId?: string;
  transactionDate: string;
  completedDate?: string;
  senderBalanceBefore: number;
  senderBalanceAfter: number;
  receiverBalanceBefore: number;
  receiverBalanceAfter: number;
  reversalReason?: string;
  isReversed: boolean;
}

export const receiptApi = {
  getByTransactionId: (transactionId: number) =>
    apiRequest<TransactionReceiptDTO>(`/transaction/${transactionId}/receipt`),
};

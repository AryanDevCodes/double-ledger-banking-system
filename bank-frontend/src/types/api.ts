// Types derived from OpenAPI spec

export type Status =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "ACTIVE"
  | "INACTIVE"
  | "CLOSED"
  | "INITIATED"
  | "PROCESSING"
  | "SUCCESS"
  | "REVERSED";

// Bank
export interface BankRequestDTO {
  bankName: string;
  branchAddress: string;
  ifscCode: string;
  city?: string;
  state?: string;
  branch: string;
}

export interface BankResponseDTO {
  id: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  city?: string;
  state?: string;
  branchAddress: string;
  accountNumbers?: string[];
}

// Customer
export interface CustomerRequestDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  kycStatus?: Status;
  age?: number;
  address?: string;
  customerStatus?: Status;
  username?: string;
  password?: string;
}

export interface CustomerResponseDTO {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  kycStatus: Status;
  age?: number;
  address?: string;
  customerStatus: Status;
  accountNumbers?: string[];
}

// Account
export interface AccountRequestDTO {
  initialDeposit?: number;
  customer: CustomerRequestDTO;
}

export interface AccountResponseDTO {
  accountNumber: string;
  currencyCode: string;
  balance: number;
  status: Status;
  bankId: string;
  bankName: string;
  customerId: string;
  customerName: string;
  kycStatus?: Status;
  customerStatus?: Status;
  age?: number;
  address?: string;
  userId?: number;
  username?: string;
  temporaryPassword?: string;
}

export interface ReceiverValidationResponseDTO {
  valid: boolean;
  message: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
  ifscCode?: string;
  matchedAccountCount: number;
}

export interface AccountComplianceUpdateRequestDTO {
  accountStatus?: Status;
  kycStatus?: Status;
  customerStatus?: Status;
}

// Transaction
export interface TransactionRequestDTO {
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  senderBankName?: string;
  receiverBankName?: string;
}

export interface TransactionResponseDTO {
  transactionId: number;
  senderName: string;
  senderAccountNumber: string;
  senderBankName: string;
  receiverName: string;
  receiverAccountNumber: string;
  receiverBankName: string;
  amount: number;
  status: Status;
  transactionDate: string;
}

// UPI
export interface UpiRegisterRequestDTO {
  upiId: string;
  accountNumber: string;
}

export interface UpiPayRequestDTO {
  id?: number;
  idempotencyKey?: string;
  fromUpi: string;
  toUpi: string;
  amount: number;
  status?: Status;
}

export interface UpiProfileResponseDTO {
  id: number;
  upiId: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  status: Status;
  createdAt: string;
}

// Activity feed for dashboards
export interface ActivityItem {
  id: string;
  type: "transaction" | "account" | "customer" | "system" | "security";
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  status?: "success" | "warning" | "error" | "info";
}

// Compliance metrics
export interface ComplianceMetrics {
  kycCompliance: number;
  amlChecks: number;
  pendingReviews: number;
  flaggedTransactions: number;
  lastAuditDate: string;
  nextAuditDate: string;
}

// Auth
export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  username: string;
  email: string;
  roles: string[];
  role: string;
}

export interface DebitCardType {
  id: number;
  accountId: number;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cardType: string;
  status: string;
  isVirtual: boolean;
  isContactlessEnabled: boolean;
  isInternationalEnabled: boolean;
  merchantCategoryBlocks?: string[];
  dailyLimit: number;
  monthlyLimit: number;
  spentToday: number;
  spentMonth: number;
  isLinkedToUpi: boolean;
  otpRequired: boolean;
  blockedReason?: string;
  createdAt: string;
  issueDate?: string;
  blockedDate?: string;
}

export interface CreditCardType {
  id: number;
  accountId: number;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cardType: string;
  status: string;
  creditLimit: number;
  availableCredit: number;
  currentBalance: number;
  minimumDue: number;
  dueDate: number;
  isContactlessEnabled: boolean;
  isInternationalEnabled: boolean;
  dailyLimit: number;
  monthlyLimit?: number;
  isLinkedToUpi: boolean;
  otpRequired: boolean;
  rewardPoints: number;
  cashbackPercentage: number;
  merchantCategoryBlocks?: string[];
  planId?: number;
  planName?: string;
  planApr?: number;
  planAnnualFee?: number;
  planGracePeriodDays?: number;
  planLateFee?: number;
  blockedReason?: string;
  createdAt: string;
  issueDate?: string;
  blockedDate?: string;
}

export interface LoanType {
  id: number;
  customerId: number;
  accountId: number;
  loanType: string;
  principalAmount: number;
  loanAmount: number;
  outstandingAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  endDate?: string;
  nextEmiDate?: string;
  emisPaid: number;
  emisRemaining: number;
  status: string;
  collateralDetails?: string;
  isForeclosureAllowed: boolean;
  foreclosureCharges?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EMIType {
  id: number;
  loanId: number;
  emiNumber: number;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  dueDate: string;
  paymentDate?: string;
  amountPaid: number;
  status: string;
  penalties: number;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

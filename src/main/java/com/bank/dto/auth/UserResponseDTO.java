package com.bank.dto.auth;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class UserResponseDTO {
  private Long id;
  private String username;
  private String email;
  private String fullName;
  private String phoneNumber;
  private String avatarUrl;
  private String primaryRole;
  private Boolean isActive;
  private Boolean isLocked;
  private Set<String> roles;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime lastLogin;
  private String customerId;
  private String customerStatus;
  private String kycStatus;
  private Integer age;
  private String address;
  private Long accountCount;
  private BigDecimal totalBalance;
  private Long transactionCount;
  private Long upiProfileCount;
  private Long managedBankCount;
  private Long managedCustomerCount;
  private Long managedAccountCount;
  private Long managedTransactionCount;
  private Long managedUpiProfileCount;
  private Long pendingKycCount;
  private Long activeSessionCount;
  private Long failedLoginCount;
  private Long auditSuccessCount;
  private Long auditFailureCount;
}

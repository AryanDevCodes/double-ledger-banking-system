package com.bank.dto.account;

import com.bank.entity.Status;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class AccountResponseDTO {

  private String accountNumber;
  private String currencyCode;
  private BigDecimal balance;
  private Status status;

  // Only include IDs to avoid circular references excluding entities directly
  private String bankId;
  private String bankName;
  private String customerId;
  private String customerName;
  private Status kycStatus;
  private Status customerStatus;
  private Integer age;
  private String address;

  // Linked auth info (username/password only returned for newly-created users)
  private Long userId;
  private String username;
  private String temporaryPassword;
}

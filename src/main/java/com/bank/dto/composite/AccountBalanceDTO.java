package com.bank.dto.composite;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountBalanceDTO {
  private String accountNumber;
  private BigDecimal balance;
  private String bankName;
  private String status;
  private String errorMessage;
}

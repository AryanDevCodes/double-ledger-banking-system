package com.bank.dto.composite;

import com.bank.dto.bank.BankResponseDTO;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BankOperationsSummaryDTO {
  private BankResponseDTO bank;
  private int totalAccounts;
  private int totalCustomers;
  private BigDecimal totalBalance;
  private long totalTransactions;
  private long completedTransactions;
  private long reversedTransactions;
  private long failedTransactions;
}

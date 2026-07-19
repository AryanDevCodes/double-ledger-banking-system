package com.bank.dto.composite;

import com.bank.dto.account.AccountResponseDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.dto.upi.UpiProfileResponseDTO;
import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountOverviewDTO {
  private List<AccountResponseDTO> accounts;
  private BigDecimal totalBalance;
  private int totalAccounts;
  private List<TransactionResponseDTO> recentTransactions;
  private List<UpiProfileResponseDTO> upiProfiles;
  private int totalTransactions;
  private int activeUpiProfiles;
}

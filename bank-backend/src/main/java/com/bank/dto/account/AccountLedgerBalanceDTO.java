package com.bank.dto.account;

import com.bank.entity.Status;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountLedgerBalanceDTO {

  private String accountNumber;
  private String currencyCode;
  private String bankName;
  private Status accountStatus;

  /** Net balance: totalReceived - totalSent (authoritative ledger balance). */
  private BigDecimal liveBalance;

  /** Sum of all CREDIT entries for this account. */
  private BigDecimal totalReceived;

  /** Sum of all DEBIT entries for this account. */
  private BigDecimal totalSent;
}

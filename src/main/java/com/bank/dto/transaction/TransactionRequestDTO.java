package com.bank.dto.transaction;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class TransactionRequestDTO {

  @NotNull(message = "sender account can't be null")
  private String senderAccount;

  @NotNull(message = "please provide a receiverAccount")
  private String receiverAccount;

  @NotNull(message = "amount is required")
  private BigDecimal amount;

  // Optional: can provide bankName instead of full account number for easier
  // transactions
  private String senderBankName;
  private String receiverBankName;
}

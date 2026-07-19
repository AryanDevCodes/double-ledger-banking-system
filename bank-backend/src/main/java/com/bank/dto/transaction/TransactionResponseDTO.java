package com.bank.dto.transaction;

import com.bank.entity.Status;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class TransactionResponseDTO {
  private Long transactionId;
  private String senderName;
  private String senderAccountNumber;
  private String senderBankName;
  private String receiverName;
  private String receiverAccountNumber;
  private String receiverBankName;
  private BigDecimal amount;
  private Status status;
  private LocalDateTime transactionDate;
  private Long reversalOfTransactionId;
  private String reversalReason;
}

package com.bank.dto.composite;

import com.bank.dto.transaction.TransactionResponseDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransferReceiptDTO {
  private TransactionResponseDTO transaction;
  private BigDecimal senderNewBalance;
  private BigDecimal receiverNewBalance;
  private String senderAccountNumber;
  private String receiverAccountNumber;
  private LocalDateTime processedAt;
  private String status;
}

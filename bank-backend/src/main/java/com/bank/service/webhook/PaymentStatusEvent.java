package com.bank.service.webhook;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PaymentStatusEvent {
  /** e.g. "transaction.completed", "transaction.failed", "transaction.reversed". */
  private final String eventType;
  private final Long transactionId;
  private final String senderAccountNumber;
  private final String receiverAccountNumber;
  private final BigDecimal amount;
  private final String status;
  private final LocalDateTime occurredAt;
}

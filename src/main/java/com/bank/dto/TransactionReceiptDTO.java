package com.bank.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionReceiptDTO {
    private String receiptId;
    private Long transactionId;
    private String transactionType;
    private String status;
    private BigDecimal amount;
    private String currency;

    private String senderName;
    private String senderAccountNumber;
    private String senderBankName;
    private String senderIfsc;

    private String receiverName;
    private String receiverAccountNumber;
    private String receiverBankName;
    private String receiverIfsc;

    private String upiId;
    private String description;
    private String referenceId;

    private LocalDateTime transactionDate;
    private LocalDateTime completedDate;

    private BigDecimal senderBalanceBefore;
    private BigDecimal senderBalanceAfter;
    private BigDecimal receiverBalanceBefore;
    private BigDecimal receiverBalanceAfter;

    private String reversalReason;
    private boolean isReversed;
}

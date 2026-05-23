package com.bank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.persistence.Entity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "transactions", uniqueConstraints = { @UniqueConstraint(columnNames = "transaction_id") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "senderAccount", "receiverAccount" })
public class Transaction {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long transactionId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "from_account_id", nullable = false)
  private Account senderAccount;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "to_account_id", nullable = false)
  private Account receiverAccount;

  @ManyToOne
  @JoinColumn(name = "sender_bank_id", columnDefinition = "VARCHAR(255)")
  private Bank senderBank;

  @ManyToOne
  @JoinColumn(name = "receiver_bank_id", columnDefinition = "VARCHAR(255)")
  private Bank receiverBank;

  // Denormalized fields for faster queries and historical accuracy
  @Column(name = "sender_name")
  private String senderName;

  @Column(name = "sender_account_number")
  private String senderAccountNumber;

  @Column(name = "sender_email")
  private String senderEmail;

  @Column(name = "sender_bank_name")
  private String senderBankName;

  @Column(name = "receiver_name")
  private String receiverName;

  @Column(name = "receiver_account_number")
  private String receiverAccountNumber;

  @Column(name = "receiver_email")
  private String receiverEmail;

  @Column(name = "receiver_bank_name")
  private String receiverBankName;

  @Column(name = "amount", nullable = false)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private Status status = Status.INITIATED;

  @CreationTimestamp
  @Column(name = "transaction_date", nullable = false, updatable = false)
  private LocalDateTime transactionDate;

  /**
   * When this transaction is itself a reversal, points to the original
   * transaction's id.
   */
  @Column(name = "reversal_of_transaction_id")
  private Long reversalOfTransactionId;

  /** Free-text reason captured when a reversal is performed. */
  @Column(name = "reversal_reason", length = 512)
  private String reversalReason;
}

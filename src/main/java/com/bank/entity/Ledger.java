package com.bank.entity;

import com.bank.ledger.EntryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CurrentTimestamp;

@Table(
    name = "ledger",
    uniqueConstraints = @UniqueConstraint(columnNames = {"referenceId", "accountId", "entryType"}))
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class Ledger {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long ledgerId;

  private Long accountId;
  private BigDecimal amount;

  // Transaction Id
  private String referenceId;

  @Enumerated(EnumType.STRING)
  private EntryType entryType;

  @Column(nullable = false, updatable = false)
  @CurrentTimestamp
  private Instant ledgerDate;

  public Ledger(Long accountId, BigDecimal amount, String refId, EntryType entryType) {
    this.accountId = accountId;
    this.amount = amount;
    this.entryType = entryType;
    this.referenceId = refId;
  }
}

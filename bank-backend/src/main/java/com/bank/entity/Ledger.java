package com.bank.entity;

import com.bank.ledger.EntryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CurrentTimestamp;

@Table(name = "ledger", uniqueConstraints = @UniqueConstraint(columnNames = { "reference_id", "account_id",
    "entry_type" }))
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Ledger {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long ledgerId;

  @ManyToOne(optional = false)
  @JoinColumn(name = "account_id", nullable = false)
  private Account account;

  @Column(nullable = false)
  private BigDecimal amount;

  @Column(name = "reference_id")
  private String referenceId;

  @Enumerated(EnumType.STRING)
  private EntryType entryType;

  @Column(nullable = false, updatable = false)
  @CurrentTimestamp
  private Instant ledgerDate;

  public Ledger(Account account, BigDecimal amount, String refId, EntryType entryType) {
    this.account = account;
    this.amount = amount;
    this.entryType = entryType;
    this.referenceId = refId;
  }
}

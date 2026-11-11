package com.bank.entity;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "account", uniqueConstraints = @UniqueConstraint(columnNames = "account_number"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({
    "hibernateLazyInitializer",
    "handler",
    "bank",
    "customer",
    "receivedTransactions",
    "sentTransactions"
})
public class Account {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "account_number", nullable = false, unique = true)
  private String accountNumber;

  @Column(name = "currency_code", nullable = false, updatable = false, length = 3)
  @Builder.Default
  private String currencyCode = "INR";

  @Deprecated
  @Column(name = "balance", nullable = false, updatable = false)
  private BigDecimal balance;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private Status status = Status.ACTIVE;

  @ManyToOne
  @JoinColumn(name = "bank_id", nullable = false, columnDefinition = "VARCHAR(255)")
  private Bank bank;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "customer_id", columnDefinition = "VARCHAR(255)")
  private Customer customer;

  @OneToMany(mappedBy = "receiverAccount", fetch = FetchType.LAZY)
  private List<Transaction> receivedTransactions;

  @OneToMany(mappedBy = "senderAccount", fetch = FetchType.LAZY)
  private List<Transaction> sentTransactions; /*
                                               * @PrePersist private void setAccountNumber() { if (bank != null) {
                                               * this.accountNumber = bank.getBankName() + "_" +
                                               * UUID.randomUUID().toString(); } else { throw new
                                               * IllegalStateException("Bank must be set before persisting the account."
                                               * ); } }
                                               */
}

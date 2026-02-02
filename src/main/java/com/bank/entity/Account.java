package com.bank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "account",
            uniqueConstraints = @UniqueConstraint(columnNames = "account_number")
        )
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "bank", "customer", "receivedTransactions", "sentTransactions"})
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_number", nullable = false, unique = true)
    private String accountNumber;

    @Column(name = "currency_code", nullable = false, updatable = false, length = 3)
    @Builder.Default
    private String currencyCode = "INR";

    @Column(name = "openingBalance", nullable = false)
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
    private List<Transaction> sentTransactions;

/*    @PrePersist
    private void setAccountNumber() {
        if (bank != null) {
            this.accountNumber = bank.getBankName() + "_" + UUID.randomUUID().toString();
        } else {
            throw new IllegalStateException("Bank must be set before persisting the account.");
        }
    }*/
}

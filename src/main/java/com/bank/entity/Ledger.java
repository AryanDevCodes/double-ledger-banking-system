package com.bank.entity;

import com.bank.ledger.EntryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CurrentTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Table(
        name = "ledger",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {
                        "referenceId","accountId","entryType"
                }
        )
)
@Entity
@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class Ledger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ledgerId;
    private Long accountId;

    private BigDecimal amount;
    // transaction Id
    private String referenceId;

    @Enumerated(EnumType.STRING)
    private EntryType entryType;

    @Column(nullable = false, updatable = false)
    @CurrentTimestamp
    private Instant ledgerDate;

    public Ledger( Long accountId, BigDecimal amount, String refId, EntryType entryType ) {
        this.accountId = accountId;
        this.amount = amount;
        this.entryType = entryType;
        this.referenceId = refId;
    }


}

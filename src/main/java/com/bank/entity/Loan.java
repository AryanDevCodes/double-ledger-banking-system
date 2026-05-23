package com.bank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CurrentTimestamp;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "loan_type", nullable = false)
    private String loanType; // PERSONAL, HOME, AUTO, EDUCATION

    @Column(name = "principal_amount", nullable = false)
    private BigDecimal principalAmount;

    @Column(name = "loan_amount", nullable = false)
    private BigDecimal loanAmount;

    @Column(name = "outstanding_amount", nullable = false)
    private BigDecimal outstandingAmount;

    @Column(name = "interest_rate", nullable = false)
    private BigDecimal interestRate; // Annual percentage

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "emi_amount", nullable = false)
    private BigDecimal emiAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "next_emi_date")
    private LocalDate nextEmiDate;

    @Column(name = "emis_paid")
    @Builder.Default
    private Integer emisPaid = 0;

    @Column(name = "emis_remaining")
    private Integer emisRemaining;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "collateral_details")
    private String collateralDetails;

    @Column(name = "is_foreclosure_allowed")
    @Builder.Default
    private Boolean isForeclosureAllowed = true;

    @Column(name = "foreclosure_charges")
    private BigDecimal foreclosureCharges;

    @CurrentTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

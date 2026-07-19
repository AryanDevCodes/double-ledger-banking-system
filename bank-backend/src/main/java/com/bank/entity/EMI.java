package com.bank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CurrentTimestamp;

@Entity
@Table(name = "emis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EMI {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id")
    private Loan loan;

    @Column(name = "emi_number", nullable = false)
    private Integer emiNumber;

    @Column(name = "emi_amount", nullable = false)
    private BigDecimal emiAmount;

    @Column(name = "principal_component")
    private BigDecimal principalComponent;

    @Column(name = "interest_component")
    private BigDecimal interestComponent;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "amount_paid")
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "penalties")
    @Builder.Default
    private BigDecimal penalties = BigDecimal.ZERO;

    @Column(name = "remarks")
    private String remarks;

    @CurrentTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

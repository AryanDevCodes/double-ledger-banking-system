package com.bank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "credit_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "apr", nullable = false)
    private BigDecimal apr;

    @Column(name = "annual_fee", nullable = false)
    private BigDecimal annualFee;

    @Column(name = "late_fee", nullable = false)
    private BigDecimal lateFee;

    @Column(name = "grace_period_days", nullable = false)
    private Integer gracePeriodDays;

    @Column(name = "min_limit", nullable = false)
    private BigDecimal minLimit;

    @Column(name = "max_limit", nullable = false)
    private BigDecimal maxLimit;

    @Column(name = "cashback_percentage", nullable = false)
    private BigDecimal cashbackPercentage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

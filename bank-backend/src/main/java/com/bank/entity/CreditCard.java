package com.bank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import lombok.*;
import org.hibernate.annotations.CurrentTimestamp;

@Entity
@Table(name = "credit_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_plan_id")
    private CreditPlan creditPlan;

    @Column(name = "card_number", nullable = false, unique = true)
    private String cardNumber;

    @Column(name = "card_holder_name", nullable = false)
    private String cardHolderName;

    @Column(name = "expiry_date", nullable = false)
    private YearMonth expiryDate;

    @Column(name = "cvv", nullable = false)
    private String cvv;

    @Column(name = "card_type")
    private String cardType; // e.g., "Visa Platinum", "Mastercard Gold"

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "credit_limit", nullable = false)
    private BigDecimal creditLimit;

    @Column(name = "available_credit", nullable = false)
    private BigDecimal availableCredit;

    @Column(name = "current_balance")
    @Builder.Default
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "minimum_due")
    private BigDecimal minimumDue;

    @Column(name = "due_date")
    private Integer dueDate; // Day of month (1-28)

    @Column(name = "is_contactless_enabled")
    @Builder.Default
    private Boolean isContactlessEnabled = true;

    @Column(name = "is_international_enabled")
    @Builder.Default
    private Boolean isInternationalEnabled = true;

    @Column(name = "merchant_category_blocks", length = 1000)
    private String merchantCategoryBlocks;

    @Column(name = "daily_limit")
    private BigDecimal dailyLimit;

    @Column(name = "monthly_limit")
    private BigDecimal monthlyLimit;

    @Column(name = "is_linked_to_upi")
    @Builder.Default
    private Boolean isLinkedToUpi = false;

    @Column(name = "otp_required")
    @Builder.Default
    private Boolean otpRequired = true;

    @Column(name = "reward_points")
    @Builder.Default
    private Long rewardPoints = 0L;

    @Column(name = "cashback_percentage")
    private BigDecimal cashbackPercentage;

    @Column(name = "blocked_reason")
    private String blockedReason;

    @CurrentTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "blocked_date")
    private LocalDateTime blockedDate;
}

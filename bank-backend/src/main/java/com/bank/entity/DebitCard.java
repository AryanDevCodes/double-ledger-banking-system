package com.bank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import lombok.*;
import org.hibernate.annotations.CurrentTimestamp;

@Entity
@Table(name = "debit_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebitCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "card_number", nullable = false, unique = true)
    private String cardNumber; // Last 4 digits visible

    @Column(name = "card_holder_name", nullable = false)
    private String cardHolderName;

    @Column(name = "expiry_date", nullable = false)
    private YearMonth expiryDate;

    @Column(name = "cvv", nullable = false)
    private String cvv;

    @Column(name = "card_type")
    private String cardType; // e.g., "Visa", "Mastercard"

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "is_virtual")
    @Builder.Default
    private Boolean isVirtual = false;

    @Column(name = "is_contactless_enabled")
    @Builder.Default
    private Boolean isContactlessEnabled = true;

    @Column(name = "is_international_enabled")
    @Builder.Default
    private Boolean isInternationalEnabled = false;

    @Column(name = "merchant_category_blocks", length = 1000)
    private String merchantCategoryBlocks;

    @Column(name = "daily_limit")
    private BigDecimal dailyLimit;

    @Column(name = "monthly_limit")
    private BigDecimal monthlyLimit;

    @Column(name = "spent_today")
    @Builder.Default
    private BigDecimal spentToday = BigDecimal.ZERO;

    @Column(name = "spent_month")
    @Builder.Default
    private BigDecimal spentMonth = BigDecimal.ZERO;

    @Column(name = "is_linked_to_upi")
    @Builder.Default
    private Boolean isLinkedToUpi = false;

    @Column(name = "otp_required")
    @Builder.Default
    private Boolean otpRequired = true;

    @Column(name = "blocked_reason")
    private String blockedReason; // e.g., "LOST", "STOLEN", "FRAUD"

    @CurrentTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "blocked_date")
    private LocalDateTime blockedDate;
}

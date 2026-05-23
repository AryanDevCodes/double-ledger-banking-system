package com.bank.dto.card;

import java.math.BigDecimal;
import java.util.List;
import java.time.YearMonth;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardDTO {
    private Long id;
    private Long accountId;
    private String cardNumber; // Last 4 digits
    private String cardHolderName;
    private YearMonth expiryDate;
    private String cardType;
    private String status;
    private BigDecimal creditLimit;
    private BigDecimal availableCredit;
    private BigDecimal currentBalance;
    private BigDecimal minimumDue;
    private Integer dueDate;
    private Boolean isContactlessEnabled;
    private Boolean isInternationalEnabled;
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private Boolean isLinkedToUpi;
    private Boolean otpRequired;
    private Long rewardPoints;
    private BigDecimal cashbackPercentage;
    private List<String> merchantCategoryBlocks;
    private Long planId;
    private String planName;
    private BigDecimal planApr;
    private BigDecimal planAnnualFee;
    private Integer planGracePeriodDays;
    private BigDecimal planLateFee;
    private String blockedReason;
    private String createdAt;
    private String issueDate;
    private String blockedDate;
}

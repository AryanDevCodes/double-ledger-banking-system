package com.bank.dto.card;

import java.math.BigDecimal;
import java.util.List;
import java.time.YearMonth;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebitCardDTO {
    private Long id;
    private Long accountId;
    private String cardNumber; // Last 4 digits
    private String cardHolderName;
    private YearMonth expiryDate;
    private String cardType;
    private String status;
    private Boolean isVirtual;
    private Boolean isContactlessEnabled;
    private Boolean isInternationalEnabled;
    private List<String> merchantCategoryBlocks;
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private BigDecimal spentToday;
    private BigDecimal spentMonth;
    private Boolean isLinkedToUpi;
    private Boolean otpRequired;
    private String blockedReason;
    private String createdAt;
    private String issueDate;
    private String blockedDate;
}

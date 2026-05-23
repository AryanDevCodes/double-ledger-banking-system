package com.bank.dto.loan;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanDTO {
    private Long id;
    private Long customerId;
    private Long accountId;
    private String loanType;
    private BigDecimal principalAmount;
    private BigDecimal loanAmount;
    private BigDecimal outstandingAmount;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal emiAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate nextEmiDate;
    private Integer emisPaid;
    private Integer emisRemaining;
    private String status;
    private String collateralDetails;
    private Boolean isForeclosureAllowed;
    private BigDecimal foreclosureCharges;
    private String createdAt;
    private String updatedAt;
}

package com.bank.dto.plan;

import java.math.BigDecimal;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditPlanDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal apr;
    private BigDecimal annualFee;
    private BigDecimal lateFee;
    private Integer gracePeriodDays;
    private BigDecimal minLimit;
    private BigDecimal maxLimit;
    private BigDecimal cashbackPercentage;
    private String status;
}

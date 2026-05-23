package com.bank.dto.loan;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EMIDTO {
    private Long id;
    private Long loanId;
    private Integer emiNumber;
    private BigDecimal emiAmount;
    private BigDecimal principalComponent;
    private BigDecimal interestComponent;
    private LocalDate dueDate;
    private LocalDate paymentDate;
    private BigDecimal amountPaid;
    private String status;
    private BigDecimal penalties;
    private String remarks;
    private String createdAt;
    private String updatedAt;
}

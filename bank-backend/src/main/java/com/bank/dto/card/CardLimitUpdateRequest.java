package com.bank.dto.card;

import java.math.BigDecimal;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardLimitUpdateRequest {
  private BigDecimal dailyLimit;
  private BigDecimal monthlyLimit;
}

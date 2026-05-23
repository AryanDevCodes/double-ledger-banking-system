package com.bank.dto.card;

import java.math.BigDecimal;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebitCardRequestCreateRequest {
  private String accountNumber;
  private String cardType;
  private Boolean isVirtual;
  private BigDecimal dailyLimit;
  private BigDecimal monthlyLimit;
  private Boolean otpRequired;
  private Boolean isContactlessEnabled;
  private Boolean isInternationalEnabled;
  private String deliveryMethod;
  private String deliveryAddress;
}

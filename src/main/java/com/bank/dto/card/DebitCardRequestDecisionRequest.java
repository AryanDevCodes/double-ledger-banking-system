package com.bank.dto.card;

import java.math.BigDecimal;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebitCardRequestDecisionRequest {
  private BigDecimal dailyLimit;
  private BigDecimal monthlyLimit;
  private String cardType;
  private Boolean isVirtual;
  private Boolean otpRequired;
  private Boolean isContactlessEnabled;
  private Boolean isInternationalEnabled;
  private String deliveryMethod;
  private String deliveryAddress;
  private String trackingNumber;
  private String expectedDeliveryDate;
  private String reviewNotes;
  private String rejectionReason;
}

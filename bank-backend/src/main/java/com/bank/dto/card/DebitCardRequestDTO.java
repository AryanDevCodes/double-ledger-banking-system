package com.bank.dto.card;

import java.math.BigDecimal;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebitCardRequestDTO {
  private Long id;
  private Long accountId;
  private String accountNumber;
  private Long requestedByUserId;
  private String requestedByName;
  private String status;
  private String requestedAt;
  private String approvedAt;
  private Long issuedCardId;
  private String cardType;
  private Boolean isVirtual;
  private BigDecimal dailyLimit;
  private BigDecimal monthlyLimit;
  private Boolean otpRequired;
  private Boolean isContactlessEnabled;
  private Boolean isInternationalEnabled;
  private String deliveryMethod;
  private String deliveryAddress;
  private String deliveryStatus;
  private String trackingNumber;
  private String expectedDeliveryDate;
  private String issuedAt;
  private String dispatchedAt;
  private String deliveredAt;
  private String kycStatusAtRequest;
  private String reviewNotes;
  private String rejectionReason;
}

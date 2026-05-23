package com.bank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CurrentTimestamp;

@Entity
@Table(name = "debit_card_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebitCardRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "account_id")
  private Account account;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "requested_by_user_id")
  private User requestedBy;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  @Builder.Default
  private CardRequestStatus status = CardRequestStatus.PENDING;

  @Column(name = "card_type")
  private String cardType;

  @Column(name = "is_virtual")
  @Builder.Default
  private Boolean isVirtual = false;

  @Column(name = "daily_limit")
  private BigDecimal dailyLimit;

  @Column(name = "monthly_limit")
  private BigDecimal monthlyLimit;

  @Column(name = "otp_required")
  @Builder.Default
  private Boolean otpRequired = true;

  @Column(name = "is_contactless_enabled")
  @Builder.Default
  private Boolean isContactlessEnabled = true;

  @Column(name = "is_international_enabled")
  @Builder.Default
  private Boolean isInternationalEnabled = false;

  @Column(name = "delivery_method")
  private String deliveryMethod;

  @Column(name = "delivery_address", length = 512)
  private String deliveryAddress;

  @Enumerated(EnumType.STRING)
  @Column(name = "delivery_status")
  @Builder.Default
  private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;

  @Column(name = "tracking_number", length = 128)
  private String trackingNumber;

  @Column(name = "expected_delivery_date")
  private LocalDateTime expectedDeliveryDate;

  @Column(name = "issued_at")
  private LocalDateTime issuedAt;

  @Column(name = "dispatched_at")
  private LocalDateTime dispatchedAt;

  @Column(name = "delivered_at")
  private LocalDateTime deliveredAt;

  @Column(name = "kyc_status_at_request", length = 32)
  private String kycStatusAtRequest;

  @Column(name = "review_notes", length = 512)
  private String reviewNotes;

  @Column(name = "rejection_reason", length = 512)
  private String rejectionReason;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "approved_by_user_id")
  private User approvedBy;

  @Column(name = "approved_at")
  private LocalDateTime approvedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "issued_card_id")
  private DebitCard issuedCard;

  @CurrentTimestamp
  @Column(name = "requested_at", updatable = false)
  private LocalDateTime requestedAt;
}

package com.bank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Subscription for outbound payment-status callbacks. Each event delivered to {@link #targetUrl}
 * is signed with HMAC-SHA256 over the raw JSON body using {@link #secret}; receivers verify by
 * recomputing the signature and comparing the {@code X-Bank-Signature} header.
 */
@Entity
@Table(name = "webhook_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookSubscription {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "target_url", nullable = false, length = 1024)
  private String targetUrl;

  /** Comma-separated event names this subscription wants. e.g. "transaction.completed,transaction.failed". */
  @Column(name = "event_types", nullable = false, length = 512)
  private String eventTypes;

  @Column(name = "secret", nullable = false, length = 256)
  private String secret;

  @Column(name = "active", nullable = false)
  @Builder.Default
  private boolean active = true;

  @Column(name = "description", length = 512)
  private String description;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = LocalDateTime.now();
  }
}

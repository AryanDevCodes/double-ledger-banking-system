package com.bank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "user_sessions",
    indexes = {
      @Index(name = "idx_user_sessions_token_id", columnList = "token_id", unique = true),
      @Index(name = "idx_user_sessions_active", columnList = "is_active"),
      @Index(name = "idx_user_sessions_user_id", columnList = "user_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "token_id", nullable = false, unique = true, length = 64)
  private String tokenId;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "user_name", nullable = false)
  private String userName;

  @Column(name = "ip_address", nullable = false, length = 64)
  private String ipAddress;

  @Column(name = "user_agent", nullable = false, length = 1024)
  private String userAgent;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "last_activity", nullable = false)
  private LocalDateTime lastActivity;

  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private boolean active = true;

  @PrePersist
  void prePersist() {
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
    if (lastActivity == null) {
      lastActivity = createdAt;
    }
  }
}

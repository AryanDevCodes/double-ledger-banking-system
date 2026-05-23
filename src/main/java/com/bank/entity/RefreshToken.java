package com.bank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Persistent record for issued refresh tokens. Stores only a SHA-256 hash of the raw token so a
 * leak of the database does not directly leak usable tokens. Supports rotation: each row may be
 * marked revoked and may point at the token that replaced it.
 */
@Entity
@Table(
    name = "refresh_tokens",
    indexes = {
      @Index(name = "idx_refresh_tokens_hash", columnList = "token_hash", unique = true),
      @Index(name = "idx_refresh_tokens_user", columnList = "user_id"),
      @Index(name = "idx_refresh_tokens_jti", columnList = "jti", unique = true)
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** JWT ID claim (jti) of the refresh token; lets us look up by claim without scanning hashes. */
  @Column(name = "jti", nullable = false, unique = true, length = 64)
  private String jti;

  /** SHA-256 hex of the raw refresh token. */
  @Column(name = "token_hash", nullable = false, unique = true, length = 128)
  private String tokenHash;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "username", nullable = false, length = 128)
  private String username;

  @Column(name = "issued_at", nullable = false)
  private LocalDateTime issuedAt;

  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

  @Column(name = "revoked", nullable = false)
  @Builder.Default
  private boolean revoked = false;

  @Column(name = "revoked_at")
  private LocalDateTime revokedAt;

  /** ID of the refresh token that replaced this one during rotation, if any. */
  @Column(name = "replaced_by_jti", length = 64)
  private String replacedByJti;
}

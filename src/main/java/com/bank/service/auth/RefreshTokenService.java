package com.bank.service.auth;

import com.bank.entity.RefreshToken;
import com.bank.entity.User;
import com.bank.exception.InvalidDataException;
import com.bank.repository.RefreshTokenRepository;
import com.bank.repository.UserRepository;
import com.bank.security.JwtUtil;
import io.jsonwebtoken.Claims;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Issues, rotates, and revokes refresh tokens.
 *
 * <p>
 * Refresh tokens are JWTs (signed by {@link JwtUtil}) but each issuance is also
 * persisted in the
 * database, keyed by jti and a SHA-256 hash of the raw token. Validation
 * requires:
 *
 * <ul>
 * <li>JWT signature + expiration valid
 * <li>Matching DB row exists, is not revoked, and is not expired
 * </ul>
 *
 * Rotation: presenting a valid refresh token issues a brand new one and revokes
 * the old one,
 * recording the new jti in {@code replacedByJti} for audit. Reuse of a revoked
 * token revokes the
 * entire token family for that user (defence against stolen-token replay).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

  private final RefreshTokenRepository refreshTokenRepository;
  private final UserRepository userRepository;
  private final JwtUtil jwtUtil;

  @Transactional
  public String issueForUser(User user) {
    String raw = jwtUtil.generateRefreshToken(user);
    persist(raw, user);
    return raw;
  }

  @Transactional
  public Rotation rotate(String presentedRaw) {
    if (presentedRaw == null || presentedRaw.isBlank()) {
      throw new InvalidDataException("Refresh token is required", "refreshToken", null);
    }

    try {
      jwtUtil.parseClaims(presentedRaw);
    } catch (Exception ex) {
      throw new InvalidDataException("Invalid refresh token", "refreshToken", null);
    }

    String hash = sha256Hex(presentedRaw);
    RefreshToken stored =
        refreshTokenRepository
            .findByTokenHash(hash)
            .orElseThrow(
                () -> new InvalidDataException("Unknown refresh token", "refreshToken", null));

    LocalDateTime now = LocalDateTime.now();
    if (stored.isRevoked()) {
      // Token-reuse defence: revoke all outstanding tokens for this user.
      log.warn(
          "Refresh-token reuse detected for user {} (jti={}) - revoking all tokens",
          stored.getUsername(),
          stored.getJti());
      refreshTokenRepository.revokeAllForUser(stored.getUserId(), now);
      throw new InvalidDataException(
          "Refresh token has been revoked. Please log in again.", "refreshToken", null);
    }
    if (stored.getExpiresAt() != null && stored.getExpiresAt().isBefore(now)) {
      throw new InvalidDataException("Refresh token expired", "refreshToken", null);
    }

    User user =
        userRepository
            .findById(stored.getUserId())
            .orElseThrow(
                () -> new InvalidDataException("User no longer exists", "refreshToken", null));

    // Issue new token and link rotation chain.
    String newRaw = jwtUtil.generateRefreshToken(user);
    RefreshToken newRow = persist(newRaw, user);

    stored.setRevoked(true);
    stored.setRevokedAt(now);
    stored.setReplacedByJti(newRow.getJti());
    refreshTokenRepository.save(stored);

    String newAccess = jwtUtil.generateToken(user);
    return new Rotation(user, newAccess, newRaw);
  }

  @Transactional
  public void revoke(String raw) {
    if (raw == null || raw.isBlank()) {
      return;
    }
    String hash = sha256Hex(raw);
    Optional<RefreshToken> existing = refreshTokenRepository.findByTokenHash(hash);
    existing.ifPresent(
        rt -> {
          if (!rt.isRevoked()) {
            rt.setRevoked(true);
            rt.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(rt);
          }
        });
  }

  @Transactional
  public void revokeAllForUser(Long userId) {
    if (userId == null) return;
    refreshTokenRepository.revokeAllForUser(userId, LocalDateTime.now());
  }

  private RefreshToken persist(String raw, User user) {
    Claims claims = jwtUtil.parseClaims(raw);
    LocalDateTime issuedAt =
        LocalDateTime.ofInstant(claims.getIssuedAt().toInstant(), ZoneId.systemDefault());
    LocalDateTime expiresAt =
        LocalDateTime.ofInstant(claims.getExpiration().toInstant(), ZoneId.systemDefault());

    RefreshToken row =
        RefreshToken.builder()
            .jti(claims.getId())
            .tokenHash(sha256Hex(raw))
            .userId(user.getId())
            .username(user.getUsername())
            .issuedAt(issuedAt)
            .expiresAt(expiresAt)
            .revoked(false)
            .build();
    return refreshTokenRepository.save(row);
  }

  static String sha256Hex(String input) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(digest.length * 2);
      for (byte b : digest) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 not available", e);
    }
  }

  /** Result of a rotation operation. */
  public record Rotation(User user, String accessToken, String refreshToken) {}
}
  

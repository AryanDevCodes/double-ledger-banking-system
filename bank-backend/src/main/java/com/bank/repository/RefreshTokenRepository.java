package com.bank.repository;

import com.bank.entity.RefreshToken;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  Optional<RefreshToken> findByJti(String jti);

  List<RefreshToken> findByUserIdAndRevokedFalse(Long userId);

  @Modifying
  @Query(
      "update RefreshToken r set r.revoked = true, r.revokedAt = :now where r.userId = :userId and"
          + " r.revoked = false")
  int revokeAllForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}

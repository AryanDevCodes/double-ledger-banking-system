package com.bank.repository;

import com.bank.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);

  Optional<User> findByEmail(String email);

  boolean existsByUsername(String username);

  boolean existsByEmail(String email);

  Optional<User> findByPasswordResetToken(String passwordResetToken);

  @Query(
      "SELECT u FROM User u WHERE lower(u.username) = lower(:identifier) OR lower(u.email) ="
          + " lower(:identifier)")
  Optional<User> findByUsernameOrEmailIgnoreCase(@Param("identifier") String identifier);

  @Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.username = :username")
  Optional<User> findByUsernameWithRoles(String username);
}

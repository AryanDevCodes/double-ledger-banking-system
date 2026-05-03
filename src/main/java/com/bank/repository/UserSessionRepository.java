package com.bank.repository;

import com.bank.entity.UserSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public
interface UserSessionRepository extends JpaRepository<UserSession, String> {
  Optional<UserSession> findByTokenId(String tokenId);

  List<UserSession> findAllByOrderByLastActivityDesc();

  List<UserSession> findByActiveTrueOrderByLastActivityDesc();

  List<UserSession> findByActiveTrue();

  long countByActiveTrue();
}

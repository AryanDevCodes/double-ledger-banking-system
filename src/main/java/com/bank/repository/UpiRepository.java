package com.bank.repository;

import com.bank.entity.Status;
import com.bank.entity.UpiProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public
interface UpiRepository extends JpaRepository<UpiProfile, Long> {
  Optional<UpiProfile> findByUpiIdAndStatus(String upiId, Status status);

  boolean existsByUpiId(String upiId);

  Optional<UpiProfile> findByUpiId(String upiId);

  List<UpiProfile> findByLinkedAccountAccountNumber(String accountNumber);

  long countByLinkedAccountAccountNumber(String accountNumber);
}

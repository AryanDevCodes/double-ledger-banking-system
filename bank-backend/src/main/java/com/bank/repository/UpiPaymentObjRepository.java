package com.bank.repository;

import com.bank.entity.UpiPaymentOBJ;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UpiPaymentObjRepository extends JpaRepository<UpiPaymentOBJ, Long> {
  Optional<UpiPaymentOBJ> findByIdempotencyKey(String idempotencyKey);
}

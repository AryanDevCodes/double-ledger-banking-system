package com.bank.repository;

import com.bank.entity.UpiPaymentOBJ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UpiPaymentObjRepository extends JpaRepository<UpiPaymentOBJ, Long> {
    Optional<UpiPaymentOBJ> findByIdempotencyKey( String idempotencyKey );
}

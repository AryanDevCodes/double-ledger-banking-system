package com.bank.repository;

import com.bank.entity.CreditCard;
import com.bank.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditCardRepository extends JpaRepository<CreditCard, Long> {
    List<CreditCard> findByAccountId(Long accountId);
    List<CreditCard> findByAccountIdAndStatus(Long accountId, Status status);
    Optional<CreditCard> findByCardNumber(String cardNumber);
    List<CreditCard> findByAccountIdAndIsLinkedToUpi(Long accountId, Boolean isLinkedToUpi);
}

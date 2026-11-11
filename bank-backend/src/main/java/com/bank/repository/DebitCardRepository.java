package com.bank.repository;

import com.bank.entity.DebitCard;
import com.bank.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DebitCardRepository extends JpaRepository<DebitCard, Long> {
    List<DebitCard> findByAccountId(Long accountId);
    List<DebitCard> findByAccountIdAndStatus(Long accountId, Status status);
    Optional<DebitCard> findByCardNumber(String cardNumber);
    List<DebitCard> findByAccountIdAndIsLinkedToUpi(Long accountId, Boolean isLinkedToUpi);
}

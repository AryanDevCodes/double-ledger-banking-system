package com.bank.repository;

import com.bank.entity.DebitCard;
import com.bank.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DebitCardRepository extends JpaRepository<DebitCard, Long> {
    List<DebitCard> findByAccountId(Long accountId);
    List<DebitCard> findByAccountIdAndStatus(Long accountId, Status status);
    Optional<DebitCard> findByCardNumber(String cardNumber);
    List<DebitCard> findByAccountIdAndIsLinkedToUpi(Long accountId, Boolean isLinkedToUpi);
}

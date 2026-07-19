package com.bank.repository;

import com.bank.entity.CardRequestStatus;
import com.bank.entity.DebitCardRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DebitCardRequestRepository extends JpaRepository<DebitCardRequest, Long> {
  List<DebitCardRequest> findByRequestedByIdOrderByRequestedAtDesc(Long requestedById);

  List<DebitCardRequest> findByStatusOrderByRequestedAtAsc(CardRequestStatus status);
}

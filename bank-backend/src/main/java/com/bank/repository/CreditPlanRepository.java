package com.bank.repository;

import com.bank.entity.CreditPlan;
import com.bank.entity.Status;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditPlanRepository extends JpaRepository<CreditPlan, Long> {
    List<CreditPlan> findByStatus(Status status);
}

package com.bank.repository;

import com.bank.entity.EMI;
import com.bank.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EMIRepository extends JpaRepository<EMI, Long> {
    List<EMI> findByLoanId(Long loanId);
    List<EMI> findByLoanIdAndStatus(Long loanId, Status status);
    List<EMI> findByDueDateBefore(LocalDate dueDate);
    List<EMI> findByLoanIdAndStatus(Long loanId, Status status, org.springframework.data.domain.Pageable pageable);
}

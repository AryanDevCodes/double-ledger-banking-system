package com.bank.repository;

import com.bank.entity.Loan;
import com.bank.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByCustomerId(String customerId);
    List<Loan> findByCustomerIdAndStatus(String customerId, Status status);
    List<Loan> findByAccountId(Long accountId);
    List<Loan> findByLoanType(String loanType);
}

package com.bank.repository;

import com.bank.entity.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface LedgerRepository extends JpaRepository<Ledger, String> {

    @Query("""
            select coalesce(
                  sum(
                       case
                            when l.entryType = 'CREDIT' THEN l.amount
                            when l.entryType = 'DEBIT' THEN -l.amount
                        end
                        ) , 0)
            from Ledger l
                  where l.accountId = :accountId
            """)
    BigDecimal calculateBalance(Long accountId);
}

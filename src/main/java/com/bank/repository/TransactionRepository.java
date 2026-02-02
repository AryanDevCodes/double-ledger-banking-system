package com.bank.repository;

import com.bank.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("select t from Transaction t where " +
           "(t.senderAccountNumber = :accountNumber and t.senderEmail = :email) " +
           "or (t.receiverAccountNumber = :accountNumber and t.receiverEmail = :email) " +
           "order by t.transactionDate desc")
    List<Transaction> findTransactionByAccountNumberAndEmail(
            @Param("accountNumber") String accountNumber,
            @Param("email") String email );
}

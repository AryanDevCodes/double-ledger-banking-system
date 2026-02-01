package com.bank.repository;

import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("select t from Transaction t where t.senderAccount.accountNumber = :accountNumber and t.senderAccount.customer.email = :email")
    List<TransactionResponseDTO> findTransactionByAccountNumberAndEmail(
            @Param("accountNumber") String accountNumber,
            @Param("email") String email );
}

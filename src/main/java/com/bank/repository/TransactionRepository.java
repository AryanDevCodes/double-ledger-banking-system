package com.bank.repository;

import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Status;
import com.bank.entity.Transaction;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
        @Query("select t from Transaction t where "
                        + "t.senderAccountNumber = :accountNumber "
                        + "or t.receiverAccountNumber = :accountNumber "
                        + "order by t.transactionDate desc")
        List<Transaction> findTransactionByAccountNumberAndEmail(
                        @Param("accountNumber") String accountNumber, @Param("email") String email);

        @Query("SELECT t FROM Transaction t "
                        + "LEFT JOIN FETCH t.senderAccount sa "
                        + "LEFT JOIN FETCH sa.customer sc "
                        + "LEFT JOIN FETCH t.receiverAccount ra "
                        + "LEFT JOIN FETCH ra.customer rc "
                        + "WHERE t.senderAccountNumber = :accountNumber "
                        + "OR t.receiverAccountNumber = :accountNumber "
                        + "ORDER BY t.transactionDate DESC")
        List<Transaction> findTransactionByAccountNumberAndEmailWithDetails(
                        @Param("accountNumber") String accountNumber, @Param("email") String email);

        @Query("SELECT DISTINCT t FROM Transaction t "
                        + "LEFT JOIN FETCH t.senderAccount sa "
                        + "LEFT JOIN FETCH sa.customer sc "
                        + "LEFT JOIN FETCH sa.bank sb "
                        + "LEFT JOIN FETCH t.receiverAccount ra "
                        + "LEFT JOIN FETCH ra.customer rc "
                        + "LEFT JOIN FETCH ra.bank rb "
                        + "WHERE t.senderAccountNumber = :accountNumber "
                        + "OR t.receiverAccountNumber = :accountNumber "
                        + "ORDER BY t.transactionDate DESC")
        List<Transaction> findTransactionByAccountNumberAndEmailAndBankNameWithDetails(
                        @Param("accountNumber") String accountNumber,
                        @Param("email") String email,
                        @Param("bankName") String bankName);

        List<TransactionResponseDTO> findByTransactionId(Long transactionId);

        Optional<Transaction> findTransactionByTransactionId(Long transactionId);

        @Query("SELECT t FROM Transaction t "
                        + "LEFT JOIN FETCH t.senderAccount sa "
                        + "LEFT JOIN FETCH sa.customer sc "
                        + "LEFT JOIN FETCH t.receiverAccount ra "
                        + "LEFT JOIN FETCH ra.customer rc")
        List<Transaction> findAllWithDetails();

        @Query("SELECT DISTINCT t FROM Transaction t "
                        + "LEFT JOIN FETCH t.senderAccount sa "
                        + "LEFT JOIN FETCH sa.customer sc "
                        + "LEFT JOIN FETCH sa.bank sb "
                        + "LEFT JOIN FETCH t.receiverAccount ra "
                        + "LEFT JOIN FETCH ra.customer rc "
                        + "LEFT JOIN FETCH ra.bank rb "
                        + "WHERE t.senderBankName = :bankName OR t.receiverBankName = :bankName "
                        + "ORDER BY t.transactionDate DESC")
        List<Transaction> findAllWithDetailsByBankName(@Param("bankName") String bankName);

        @Query("SELECT COUNT(t) FROM Transaction t "
                        + "WHERE t.senderBankName = :bankName OR t.receiverBankName = :bankName")
        long countByBankName(@Param("bankName") String bankName);

        @Query("SELECT COUNT(t) FROM Transaction t "
                        + "WHERE (t.senderBankName = :bankName OR t.receiverBankName = :bankName) "
                        + "AND t.status = :status")
        long countByBankNameAndStatus(@Param("bankName") String bankName, @Param("status") Status status);

        @Query("SELECT DISTINCT t FROM Transaction t "
                        + "LEFT JOIN FETCH t.senderAccount sa LEFT JOIN FETCH sa.bank "
                        + "LEFT JOIN FETCH t.receiverAccount ra LEFT JOIN FETCH ra.bank "
                        + "WHERE lower(t.senderAccountNumber) like lower(concat('%', :q, '%')) "
                        + "OR lower(t.receiverAccountNumber) like lower(concat('%', :q, '%')) "
                        + "OR lower(t.senderName) like lower(concat('%', :q, '%')) "
                        + "OR lower(t.receiverName) like lower(concat('%', :q, '%')) "
                        + "OR lower(t.senderBankName) like lower(concat('%', :q, '%')) "
                        + "ORDER BY t.transactionDate DESC")
        List<Transaction> searchByQuery(@Param("q") String q);

        @Query("SELECT DISTINCT t FROM Transaction t "
                        + "LEFT JOIN FETCH t.senderAccount sa "
                        + "LEFT JOIN FETCH sa.bank sb "
                        + "LEFT JOIN FETCH t.receiverAccount ra "
                        + "LEFT JOIN FETCH ra.bank rb "
                        + "WHERE (:dateFrom IS NULL OR t.transactionDate >= :dateFrom) "
                        + "AND (:dateTo IS NULL OR t.transactionDate <= :dateTo) "
                        + "AND (:amountMin IS NULL OR t.amount >= :amountMin) "
                        + "AND (:amountMax IS NULL OR t.amount <= :amountMax) "
                        + "AND (:status IS NULL OR t.status = :status) "
                        + "AND (:bankName IS NULL OR t.senderBankName = :bankName OR t.receiverBankName = :bankName) "
                        + "ORDER BY t.transactionDate DESC")
        List<Transaction> searchAdvanced(
                        @Param("dateFrom") LocalDateTime dateFrom,
                        @Param("dateTo") LocalDateTime dateTo,
                        @Param("amountMin") BigDecimal amountMin,
                        @Param("amountMax") BigDecimal amountMax,
                        @Param("status") Status status,
                        @Param("bankName") String bankName);
}

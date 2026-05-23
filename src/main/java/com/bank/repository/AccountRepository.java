package com.bank.repository;

import com.bank.entity.Account;
import com.bank.entity.Status;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer")
        List<Account> findAllWithDetails();

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer where a.bank.bankName = :bankName")
        List<Account> findByBankBankName(@Param("bankName") String bankName);

        Account findByAccountNumber(String accountNumber);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer where a.customer.email = :email")
        List<Account> findByCustomerEmail(@Param("email") String email);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer c where c.user.id = :userId")
        List<Account> findByCustomerUserId(@Param("userId") Long userId);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer c where c.user.id = :userId and a.bank.bankName = :bankName")
        List<Account> findByCustomerUserIdAndBankBankName(
                        @Param("userId") Long userId, @Param("bankName") String bankName);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer where a.customer.email = :email and a.bank.bankName = :bankName")
        List<Account> findByCustomerEmailAndBankBankName(
                        @Param("email") String email, @Param("bankName") String bankName);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer where a.customer.id = :customerId and a.bank.bankName = :bankName")
        List<Account> findByCustomerIdAndBankBankName(
                        @Param("customerId") String customerId, @Param("bankName") String bankName);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer "
                        + "where lower(a.bank.bankName) = lower(:bankName) "
                        + "and lower(a.bank.ifscCode) = lower(:ifscCode) "
                        + "and lower(a.customer.fullName) = lower(:holderName) "
                        + "and a.status = :status")
        List<Account> findReceiverMatches(
                        @Param("bankName") String bankName,
                        @Param("ifscCode") String ifscCode,
                        @Param("holderName") String holderName,
                        @Param("status") Status status);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer where a.accountNumber = :accountNumber")
        Account findByAccountNumberWithDetails(@Param("accountNumber") String accountNumber);

        @Query("select a from Account a where a.customer.id = :customerId")
        List<Account> findByCustomerId(@Param("customerId") String customerId);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer c where c.user.username = :username")
        List<Account> findByCustomerUserUsername(@Param("username") String username);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select a from Account a where a.id = :id")
        Optional<Account> lockById(@Param("id") Long id);

        @Query("select distinct a from Account a join fetch a.bank join fetch a.customer "
                        + "where lower(a.accountNumber) like lower(concat('%', :q, '%')) "
                        + "or lower(a.customer.fullName) like lower(concat('%', :q, '%')) "
                        + "or lower(a.bank.bankName) like lower(concat('%', :q, '%'))")
        List<Account> searchByQuery(@Param("q") String q);

        // @Query(
        // """
        // select a, c
        // from Account a
        // join a.customer c
        // where a.accountNumber = :accountNumber
        // and c.email = :email
        // """)
        // Optional<Account> findAccountByAccountNumberAndEmail(
        // @Param("accountNumber") String accountNumber, @Param("email") String email);
}

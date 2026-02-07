package com.bank.repository;

import com.bank.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    @Query("select a from Account a where a.bank.bankName = :bankName")
    List<Account> findByBankBankName( @Param("bankName") String bankName );

    Account findByAccountNumber( String accountNumber );


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id = :id")
    Optional<Account> lockById( @Param ("id") Long id);

//    @Query("""
//                    select a,c from Account a
//                    join a.customer c
//                    where a.accountNumber = :accountNumber
//                            and c.email = :email
//                    """)
//    Optional<Account> findAccountByAccountNumberAndEmail(@Param("accountNumber") String accountNumber, @Param("email") String email);

}

package com.bank.repository;

import com.bank.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    List<Account>   findByBankBankName(  String bankName );

    Account findByAccountNumber( String accountNumber );

}

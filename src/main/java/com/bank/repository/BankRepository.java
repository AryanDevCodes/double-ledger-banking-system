package com.bank.repository;

import com.bank.entity.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BankRepository extends JpaRepository<Bank, String> {

    @Query("select b from Bank b where b.bankName = :name")
    Bank findByBankName(@Param("name") String bankName);

    @Query("select b from Bank b join Account a on a.bank.id = b.id join UpiProfile u on u.linkedAccount.id = a.id where u.upiId = :upiId")
    Bank findByUpiId(@Param("upiId") String upiId);

}

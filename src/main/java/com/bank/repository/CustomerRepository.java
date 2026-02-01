package com.bank.repository;

import com.bank.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer,Long> {

    Customer findCustomerByFullNameAndEmailAndPhoneNumber( String fullName, String email, String phoneNumber );

    List<Customer> findCustomerByFullNameAndAccount_Bank_BankName( String fullName, String accountBankBankName );

    List<Customer> findCustomerByAccount_Bank_BankName( String bank );
}

package com.bank.repository;

import com.bank.entity.Customer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
  Customer findCustomerByFullNameAndEmailAndPhoneNumber(
      String fullName, String email, String phoneNumber);

  Customer findByEmail(String email);

  Customer findByUserId(Long userId);

  @Query(
      "select distinct c from Customer c join c.account a where a.bank.bankName = :bankName and"
          + " c.fullName = :fullName")
  List<Customer> findCustomerByFullNameAndAccount_Bank_BankName(
      @Param("fullName") String fullName, @Param("bankName") String bankName);

  @Query("select distinct c from Customer c join c.account a where a.bank.bankName = :bankName")
  List<Customer> findCustomerByAccount_Bank_BankName(@Param("bankName") String bankName);
}

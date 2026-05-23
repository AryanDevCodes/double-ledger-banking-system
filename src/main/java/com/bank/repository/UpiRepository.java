package com.bank.repository;

import com.bank.entity.Status;
import com.bank.entity.UpiProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UpiRepository extends JpaRepository<UpiProfile, Long> {
  Optional<UpiProfile> findByUpiIdAndStatus(String upiId, Status status);

  boolean existsByUpiId(String upiId);

  Optional<UpiProfile> findByUpiId(String upiId);

  List<UpiProfile> findByLinkedAccountAccountNumber(String accountNumber);

  @Query("SELECT u FROM UpiProfile u JOIN FETCH u.linkedAccount a JOIN FETCH a.bank JOIN FETCH a.customer WHERE a.accountNumber = :accountNumber")
  List<UpiProfile> findByLinkedAccountAccountNumberWithDetails(@Param("accountNumber") String accountNumber);

  @Query("SELECT u FROM UpiProfile u JOIN FETCH u.linkedAccount a JOIN FETCH a.bank JOIN FETCH a.customer WHERE a.accountNumber = :accountNumber AND a.bank.bankName = :bankName")
  List<UpiProfile> findByLinkedAccountAccountNumberAndBankNameWithDetails(
      @Param("accountNumber") String accountNumber, @Param("bankName") String bankName);

  @Query("SELECT u FROM UpiProfile u JOIN FETCH u.linkedAccount a JOIN FETCH a.bank JOIN FETCH a.customer")
  List<UpiProfile> findAllWithDetails();

  @Query("SELECT u FROM UpiProfile u JOIN FETCH u.linkedAccount a JOIN FETCH a.bank JOIN FETCH a.customer WHERE a.bank.bankName = :bankName")
  List<UpiProfile> findAllWithDetailsByBankName(@Param("bankName") String bankName);

  @Query("SELECT u FROM UpiProfile u JOIN FETCH u.linkedAccount a JOIN FETCH a.bank JOIN FETCH a.customer WHERE u.upiId = :upiId AND u.status = :status")
  Optional<UpiProfile> findByUpiIdAndStatusWithDetails(@Param("upiId") String upiId, @Param("status") Status status);

  long countByLinkedAccountAccountNumber(String accountNumber);
}

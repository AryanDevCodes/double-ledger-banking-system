package com.bank.service.account;

import com.bank.dto.account.AccountComplianceUpdateRequestDTO;
import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import java.util.List;

public interface AccountsService {
  List<AccountResponseDTO> findAll();

  List<AccountResponseDTO> findByBank(String bankName);

  List<AccountResponseDTO> findByCustomerEmail(String email);

  List<AccountResponseDTO> findByUserId(Long userId);

  AccountResponseDTO findByAccountNumber(String accountNumber);

  AccountResponseDTO createAccount(String bankName, AccountRequestDTO dto);

  AccountResponseDTO updateAccount(String accountNumber, AccountRequestDTO dto);

  AccountResponseDTO updateAccountCompliance(
      String accountNumber, AccountComplianceUpdateRequestDTO dto);

  void deleteAccount(String accountNumber);
}

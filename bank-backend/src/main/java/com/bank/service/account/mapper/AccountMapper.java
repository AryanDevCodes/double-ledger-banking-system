package com.bank.service.account.mapper;

import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.entity.Account;
import com.bank.repository.LedgerRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccountMapper {

  private final LedgerRepository ledgerRepository;

  public Account toEntity(AccountRequestDTO dto) {
    return Account.builder().build();
  }

  public AccountResponseDTO toResponseDTO(Account account) {
    if (account == null)
      return null;
    AccountResponseDTO dto = new AccountResponseDTO();
    dto.setAccountNumber(account.getAccountNumber());
    dto.setCurrencyCode(account.getCurrencyCode());
    dto.setStatus(account.getStatus());

    BigDecimal liveBalance = account.getId() != null
        ? ledgerRepository.calculateBalance(account.getId())
        : BigDecimal.ZERO;
    dto.setBalance(liveBalance);

    if (account.getBank() != null) {
      dto.setBankId(account.getBank().getId());
      dto.setBankName(account.getBank().getBankName());
    }
    if (account.getCustomer() != null) {
      dto.setCustomerId(account.getCustomer().getId());
      dto.setCustomerName(account.getCustomer().getFullName());
      dto.setKycStatus(account.getCustomer().getKycStatus());
      dto.setCustomerStatus(account.getCustomer().getCustomerStatus());
      dto.setAge(account.getCustomer().getAge());
      dto.setAddress(account.getCustomer().getAddress());
      if (account.getCustomer().getUser() != null) {
        dto.setUserId(account.getCustomer().getUser().getId());
        dto.setUsername(account.getCustomer().getUser().getUsername());
      }
    }
    return dto;
  }
}

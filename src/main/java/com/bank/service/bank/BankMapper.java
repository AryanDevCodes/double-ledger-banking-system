package com.bank.service.bank;

import com.bank.dto.bank.BankRequestDTO;
import com.bank.dto.bank.BankResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Bank;
import java.util.List;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface BankMapper {
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "accounts", ignore = true)
  Bank toEntity(BankRequestDTO dto);

  @Mapping(target = "accountNumbers", source = "accounts", qualifiedByName = "accountsToNumbers")
  BankResponseDTO toResponse(Bank bank);

  @Named("accountsToNumbers")
  default List<String> accountsToNumbers(List<Account> accounts) {
    if (accounts == null) return null;
    return accounts.stream().map(Account::getAccountNumber).collect(Collectors.toList());
  }
}

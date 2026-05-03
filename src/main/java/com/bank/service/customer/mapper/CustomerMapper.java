package com.bank.service.customer.mapper;

import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Customer;
import java.util.List;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
  Customer toEntity(CustomerRequestDTO dto);

  @Mapping(target = "accountNumbers", source = "account", qualifiedByName = "accountsToNumbers")
  CustomerResponseDTO toResponseDTO(Customer entity);

  @Named("accountsToNumbers")
  default List<String> accountsToNumbers(List<Account> accounts) {
    if (accounts == null || accounts.isEmpty()) return null;
    return accounts.stream().map(Account::getAccountNumber).collect(Collectors.toList());
  }
}

package com.bank.service.account.mapper;

import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountMapper {

    @Mapping(target = "balance", source = "initialDeposit")
    @Mapping(target = "bank", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "accountNumber", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currencyCode", ignore = true)
    @Mapping(target = "receivedTransactions", ignore = true)
    @Mapping(target = "sentTransactions", ignore = true)
    Account toEntity(AccountRequestDTO dto);

    @Mapping(target = "bankId", source = "bank.id")
    @Mapping(target = "bankName", source = "bank.bankName")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.fullName")
    @Mapping(target = "kycStatus", source = "customer.kycStatus")
    @Mapping(target = "customerStatus", source = "customer.customerStatus")
    @Mapping(target = "age", source = "customer.age")
    @Mapping(target = "address", source = "customer.address")
    @Mapping(target = "userId", source = "customer.user.id")
    @Mapping(target = "username", source = "customer.user.username")
    @Mapping(target = "temporaryPassword", ignore = true)
    AccountResponseDTO toResponseDTO(Account account);
}

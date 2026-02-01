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
    Account toEntity( AccountRequestDTO dto );

    @Mapping(target = "bankId",source = "bank.id")
    @Mapping(target = "bankName", source = "bank.bankName")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.fullName")
    AccountResponseDTO toResponseDTO( Account account );
}

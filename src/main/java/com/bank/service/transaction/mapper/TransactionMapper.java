package com.bank.service.transaction.mapper;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    @Mapping(target = "senderAccount", ignore = true)
    @Mapping(target = "receiverAccount", ignore = true)
    @Mapping(target = "senderBank", ignore = true)
    @Mapping(target = "receiverBank", ignore = true)
    @Mapping(target = "senderAccountNumber", ignore = true)
    @Mapping(target = "senderEmail", ignore = true)
    @Mapping(target = "senderBankName", ignore = true)
    @Mapping(target = "receiverAccountNumber", ignore = true)
    @Mapping(target = "receiverEmail", ignore = true)
    @Mapping(target = "receiverBankName", ignore = true)
    @Mapping(target = "transactionId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "transactionDate", ignore = true)
    Transaction toEntity( TransactionRequestDTO transactionRequestDTO);

    @Mapping(target = "senderName", source = "senderAccount.customer.fullName")
    @Mapping(target = "senderAccountNumber", source = "senderAccountNumber")
    @Mapping(target = "senderBankName", source = "senderBankName")
    @Mapping(target = "receiverName", source = "receiverAccount.customer.fullName")
    @Mapping(target = "receiverAccountNumber", source = "receiverAccountNumber")
    @Mapping(target = "receiverBankName", source = "receiverBankName")
    TransactionResponseDTO toResponseDTO(Transaction transaction);
}

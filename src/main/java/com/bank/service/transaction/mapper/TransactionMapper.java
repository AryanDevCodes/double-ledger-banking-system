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
  @Mapping(target = "senderName", ignore = true)
  @Mapping(target = "senderAccountNumber", ignore = true)
  @Mapping(target = "senderEmail", ignore = true)
  @Mapping(target = "senderBankName", ignore = true)
  @Mapping(target = "receiverName", ignore = true)
  @Mapping(target = "receiverAccountNumber", ignore = true)
  @Mapping(target = "receiverEmail", ignore = true)
  @Mapping(target = "receiverBankName", ignore = true)
  @Mapping(target = "transactionId", ignore = true)
  @Mapping(target = "status", ignore = true)
  @Mapping(target = "transactionDate", ignore = true)
  @Mapping(target = "reversalOfTransactionId", ignore = true)
  @Mapping(target = "reversalReason", ignore = true)
  Transaction toEntity(TransactionRequestDTO transactionRequestDTO);

  @Mapping(target = "senderName", source = "senderName")
  @Mapping(target = "senderAccountNumber", source = "senderAccountNumber")
  @Mapping(target = "senderBankName", source = "senderBankName")
  @Mapping(target = "receiverName", source = "receiverName")
  @Mapping(target = "receiverAccountNumber", source = "receiverAccountNumber")
  @Mapping(target = "receiverBankName", source = "receiverBankName")
  @Mapping(target = "reversalOfTransactionId", source = "reversalOfTransactionId")
  @Mapping(target = "reversalReason", source = "reversalReason")
  TransactionResponseDTO toResponseDTO(Transaction transaction);
}

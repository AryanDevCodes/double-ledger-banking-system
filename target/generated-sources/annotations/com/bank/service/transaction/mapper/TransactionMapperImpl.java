package com.bank.service.transaction.mapper;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Bank;
import com.bank.entity.Customer;
import com.bank.entity.Transaction;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-01T03:16:31+0530",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.8 (Oracle Corporation)"
)
@Component
public class TransactionMapperImpl implements TransactionMapper {

    @Override
    public Transaction toEntity(TransactionRequestDTO transactionRequestDTO) {
        if ( transactionRequestDTO == null ) {
            return null;
        }

        Transaction.TransactionBuilder transaction = Transaction.builder();

        transaction.amount( transactionRequestDTO.getAmount() );

        return transaction.build();
    }

    @Override
    public TransactionResponseDTO toResponseDTO(Transaction transaction) {
        if ( transaction == null ) {
            return null;
        }

        TransactionResponseDTO transactionResponseDTO = new TransactionResponseDTO();

        transactionResponseDTO.setSenderName( transactionSenderAccountCustomerFullName( transaction ) );
        transactionResponseDTO.setSenderAccountNumber( transactionSenderAccountAccountNumber( transaction ) );
        transactionResponseDTO.setSenderBankName( transactionSenderBankBankName( transaction ) );
        transactionResponseDTO.setReceiverName( transactionReceiverAccountCustomerFullName( transaction ) );
        transactionResponseDTO.setReceiverAccountNumber( transactionReceiverAccountAccountNumber( transaction ) );
        transactionResponseDTO.setReceiverBankName( transactionReceiverBankBankName( transaction ) );
        transactionResponseDTO.setTransactionId( transaction.getTransactionId() );
        transactionResponseDTO.setAmount( transaction.getAmount() );
        transactionResponseDTO.setStatus( transaction.getStatus() );
        transactionResponseDTO.setTransactionDate( transaction.getTransactionDate() );

        return transactionResponseDTO;
    }

    private String transactionSenderAccountCustomerFullName(Transaction transaction) {
        Account senderAccount = transaction.getSenderAccount();
        if ( senderAccount == null ) {
            return null;
        }
        Customer customer = senderAccount.getCustomer();
        if ( customer == null ) {
            return null;
        }
        return customer.getFullName();
    }

    private String transactionSenderAccountAccountNumber(Transaction transaction) {
        Account senderAccount = transaction.getSenderAccount();
        if ( senderAccount == null ) {
            return null;
        }
        return senderAccount.getAccountNumber();
    }

    private String transactionSenderBankBankName(Transaction transaction) {
        Bank senderBank = transaction.getSenderBank();
        if ( senderBank == null ) {
            return null;
        }
        return senderBank.getBankName();
    }

    private String transactionReceiverAccountCustomerFullName(Transaction transaction) {
        Account receiverAccount = transaction.getReceiverAccount();
        if ( receiverAccount == null ) {
            return null;
        }
        Customer customer = receiverAccount.getCustomer();
        if ( customer == null ) {
            return null;
        }
        return customer.getFullName();
    }

    private String transactionReceiverAccountAccountNumber(Transaction transaction) {
        Account receiverAccount = transaction.getReceiverAccount();
        if ( receiverAccount == null ) {
            return null;
        }
        return receiverAccount.getAccountNumber();
    }

    private String transactionReceiverBankBankName(Transaction transaction) {
        Bank receiverBank = transaction.getReceiverBank();
        if ( receiverBank == null ) {
            return null;
        }
        return receiverBank.getBankName();
    }
}

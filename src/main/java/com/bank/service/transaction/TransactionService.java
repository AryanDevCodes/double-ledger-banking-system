package com.bank.service.transaction;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;

import java.util.List;

public interface TransactionService {

    TransactionResponseDTO makeTransaction( TransactionRequestDTO transactionRequestDTO);
    List<TransactionResponseDTO> getAllTransactions(String accountNumber,String email);
}

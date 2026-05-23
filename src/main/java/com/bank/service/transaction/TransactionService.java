package com.bank.service.transaction;

import com.bank.dto.PagedResponse;
import com.bank.dto.TransactionReceiptDTO;
import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface TransactionService {
  TransactionResponseDTO makeTransaction(TransactionRequestDTO transactionRequestDTO);

  List<TransactionResponseDTO> getAllTransactions(String accountNumber, String email);

  List<TransactionResponseDTO> getAllTransactionsWithoutFilter();

  PagedResponse<TransactionResponseDTO> getAllTransactionsPaginated(Pageable pageable);

  List<TransactionResponseDTO> getTransactionsForUser(Long userId);

  List<TransactionResponseDTO> getTransactionsForCustomer(String customerId);

  /**
   * Reverse a previously COMPLETED transaction by posting compensating ledger
   * entries.
   */
  TransactionResponseDTO reverseTransaction(Long transactionId, String reason);

  /**
   * Get transaction receipt with full details
   */
  TransactionReceiptDTO getReceipt(Long transactionId, Long userId);
}

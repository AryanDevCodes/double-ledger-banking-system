package com.bank.service.transaction;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Status;
import com.bank.entity.Transaction;
import com.bank.exception.GlobalServiceException;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.transaction.mapper.TransactionMapper;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceIMPL implements TransactionService{
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public TransactionResponseDTO makeTransaction( @NotNull TransactionRequestDTO dto) {
        if (dto.getSenderAccount() == null || dto.getReceiverAccount() == null || dto.getAmount() == null) {
            throw new InvalidDataException("Please enter sender account, receiver account, and amount to be transferred.");
        }

        // Look for sender account - can use account number directly or find by bank name
        Account senderAccount;
        if (dto.getSenderBankName() != null && !dto.getSenderBankName().isEmpty()) {
            // If bankName is provided, find first account from that bank
            List<Account> senderAccounts = accountRepository.findByBankBankName(dto.getSenderBankName());
            if (senderAccounts.isEmpty()) {
                throw new ResourceNotFoundException("Account", "bankName", dto.getSenderBankName());
            }
            senderAccount = senderAccounts.getFirst();
        } else {
            // Use account number directly
            senderAccount = accountRepository.findByAccountNumber(dto.getSenderAccount());
            if (senderAccount == null) {
                throw new ResourceNotFoundException("Account", "accountNumber", dto.getSenderAccount());
            }
        }

        // Look up receiver account - can use account number directly or find by bank name
        Account receiverAccount;
        if (dto.getReceiverBankName() != null && !dto.getReceiverBankName().isEmpty()) {
            // If bankName is provided, find first account from that bank
            List<Account> receiverAccounts = accountRepository.findByBankBankName(dto.getReceiverBankName());
            if (receiverAccounts.isEmpty()) {
                throw new ResourceNotFoundException("Account", "bankName", dto.getReceiverBankName());
            }
            receiverAccount = receiverAccounts.getFirst();
        } else {
            // Use account number directly
            receiverAccount = accountRepository.findByAccountNumber(dto.getReceiverAccount());
            if (receiverAccount == null) {
                throw new ResourceNotFoundException("Account", "accountNumber", dto.getReceiverAccount());
            }
        }

        if (senderAccount.getBalance().compareTo(dto.getAmount()) < 0) {
            throw new GlobalServiceException("Insufficient balance in sender account");
        }

        Transaction transaction = transactionMapper.toEntity(dto);
        transaction.setSenderAccount(senderAccount);
        transaction.setReceiverAccount(receiverAccount);
        transaction.setSenderBank(senderAccount.getBank());
        transaction.setReceiverBank(receiverAccount.getBank());
        transaction.setAmount(dto.getAmount());

        try {
            // Update balances
            senderAccount.setBalance(senderAccount.getBalance().subtract(dto.getAmount()));
            receiverAccount.setBalance(receiverAccount.getBalance().add(dto.getAmount()));

            // Save accounts only after successful updates
            accountRepository.save(senderAccount);
            accountRepository.save(receiverAccount);

            // Finalize transaction
            transaction.setStatus(Status.COMPLETED);
            transaction = transactionRepository.save(transaction);  // Only save after all is successful

        } catch (Exception e) {
            transaction.setStatus(Status.FAILED);
            transactionRepository.save(transaction);  // Save the transaction with failed status
            throw new GlobalServiceException("Transaction Failed: " + e.getMessage());
        }

        return transactionMapper.toResponseDTO(transaction);
    }

    @Override
    public List<TransactionResponseDTO> getAllTransactions( String accountNumber, String email ) {
        if ( accountNumber==null || email==null ){
            throw new InvalidDataException("please enter account number and email address");
        }
        return transactionRepository.findTransactionByAccountNumberAndEmail(accountNumber,email);
    }
}

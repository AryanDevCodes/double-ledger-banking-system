package com.bank.service.transaction;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Status;
import com.bank.entity.Transaction;
import com.bank.exception.GlobalServiceException;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.ledger.LedgerWriter;
import com.bank.repository.AccountRepository;
import com.bank.repository.LedgerRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.transaction.mapper.TransactionMapper;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceIMPL implements TransactionService{
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final AccountRepository accountRepository;
    private final LedgerWriter ledgerWriter;
    private final LedgerRepository ledgerRepository;

/*    @Override
    @Transactional
    public TransactionResponseDTO makeTransaction(@NotNull TransactionRequestDTO dto) {

       if ( dto.getSenderAccount() == null || dto.getReceiverAccount() == null || dto.getAmount() == null){
           throw new InvalidDataException( " Sender account, receiver account, and amount are required ");
       }

       Account senderAccount = resolveSenderAccount(dto);
       Account receiverAccount = resolveReceiverAccount(dto);

       // Lock Sender account
       accountRepository.lockById(senderAccount.getId());

        BigDecimal senderBalance = ledgerRepository.calculateBalance(senderAccount.getId());
        if ( senderBalance.compareTo(dto.getAmount())<0 ){
            throw new GlobalServiceException("Insufficient balance");
        }

        Transaction transaction = transactionMapper.toEntity(dto);
        transaction.setSenderAccount(senderAccount);
        transaction.setReceiverAccount(receiverAccount);
        transaction.setSenderBank(senderAccount.getBank());
        transaction.setReceiverBank(receiverAccount.getBank());
        transaction.setAmount(dto.getAmount());
        transaction.setStatus(Status.INITIATED);
        transaction  = transactionRepository.save(transaction);

        try {
            // Ledger is the only writable
            ledgerWriter.postDebit(
                    senderAccount.getId(),
                    dto.getAmount(),
                    transaction.getTransactionId().toString()
            );
            ledgerWriter.postCredit(
                    receiverAccount.getId(),
                    dto.getAmount(),
                    transaction.getTransactionId().toString()
            );
            transaction.setStatus(Status.COMPLETED);
        }catch ( Exception e ){
            transaction.setStatus(Status.FAILED);
            throw new GlobalServiceException("Transaction Failed ", e);
        }
        return transactionMapper.toResponseDTO(transactionRepository.save(transaction));
    }*/

    @Override
    @Transactional
    public TransactionResponseDTO makeTransaction(@NotNull TransactionRequestDTO dto) {

        Account sender = accountRepository.lockById(resolveSenderAccount(dto).getId());
        Account receiver = accountRepository.lockById(resolveReceiverAccount(dto).getId());

        BigDecimal senderBalance =
                ledgerRepository.calculateBalance(sender.getId());

        if (senderBalance.compareTo(dto.getAmount()) < 0) {
            throw new GlobalServiceException("Insufficient balance");
        }

        Transaction tx = transactionMapper.toEntity(dto);
        tx.setSenderAccount(sender);
        tx.setReceiverAccount(receiver);
        tx.setSenderBank(sender.getBank());
        tx.setReceiverBank(receiver.getBank());

        // Populate denormalized fields for fast queries and historical accuracy
        tx.setSenderAccountNumber(sender.getAccountNumber());
        tx.setSenderEmail(sender.getCustomer().getEmail());
        tx.setSenderBankName(sender.getBank().getBankName());
        tx.setReceiverAccountNumber(receiver.getAccountNumber());
        tx.setReceiverEmail(receiver.getCustomer().getEmail());
        tx.setReceiverBankName(receiver.getBank().getBankName());

        tx.setStatus(Status.INITIATED);
        tx = transactionRepository.save(tx);

        try {
            ledgerWriter.postDebit(
                    sender.getId(),
                    dto.getAmount(),
                    tx.getTransactionId().toString()
            );

            ledgerWriter.postCredit(
                    receiver.getId(),
                    dto.getAmount(),
                    tx.getTransactionId().toString()
            );

            tx.setStatus(Status.COMPLETED);

        } catch (Exception e) {
            tx.setStatus(Status.FAILED);
            throw e;
        }

        return transactionMapper.toResponseDTO(
                transactionRepository.save(tx)
        );
    }


    @Override
    public List<TransactionResponseDTO> getAllTransactions( String accountNumber, String email ) {
        if ( accountNumber==null || email==null ){
            throw new InvalidDataException("please enter account number and email address");
        }
        List<Transaction> transactions = transactionRepository.findTransactionByAccountNumberAndEmail(accountNumber,email);
        return transactions.stream()
                .map(transactionMapper::toResponseDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    private Account resolveSenderAccount(TransactionRequestDTO dto) {
        if ( dto.getSenderBankName() != null && !dto.getSenderBankName().isBlank() ){
            List<Account> senderAccounts = accountRepository.findByBankBankName(dto.getSenderBankName());

            if(senderAccounts.isEmpty()){
                throw new ResourceNotFoundException("Account","bankName",dto.getSenderBankName());
            }
            return senderAccounts.getFirst();
        }

        Account senderAccount = accountRepository.findByAccountNumber(dto.getSenderAccount());

        if ( senderAccount == null ){
            throw new ResourceNotFoundException("Account","accountNumber",dto.getSenderAccount());
        }
        return senderAccount;
    }

    private Account resolveReceiverAccount(TransactionRequestDTO dto) {
        if ( dto.getReceiverBankName() != null && !dto.getReceiverBankName().isBlank() ){
            List<Account> receiverAccounts =
                    accountRepository.findByBankBankName(dto.getReceiverBankName());
            if ( receiverAccounts.isEmpty() ){
                throw new ResourceNotFoundException("Account","bankName",dto.getReceiverBankName());
            }
            return receiverAccounts.getFirst();
        }
        Account receiverAccount = accountRepository.findByAccountNumber(dto.getReceiverAccount());
        if (receiverAccount == null ){
            throw new ResourceNotFoundException("Account","accountNumber",dto.getReceiverAccount());
        }

        return receiverAccount;
    }
}

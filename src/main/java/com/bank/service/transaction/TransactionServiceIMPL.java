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

/*
    @Override
    @Transactional
    public TransactionResponseDTO makeTransaction(@NotNull TransactionRequestDTO dto) {

        Account sender = accountRepository.lockById(
                resolveSenderAccount(dto).getId()
        ).orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        Account receiver = accountRepository.lockById(resolveReceiverAccount(dto).getId())
                .orElseThrow(()-> new ResourceNotFoundException("Receiver not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new InvalidDataException("Sender and receiver cannot be the same account");
        }

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
            // Saving the updated balance to accountTable for a consistent view or a cached view
            BigDecimal updatedSenderBalance =
                    ledgerRepository.calculateBalance(sender.getId());

            BigDecimal updatedReceiverBalance =
                    ledgerRepository.calculateBalance(receiver.getId());

            sender.setBalance(updatedSenderBalance);
            receiver.setBalance(updatedReceiverBalance);

        } catch (Exception e) {
            tx.setStatus(Status.FAILED);
            transactionRepository.save(tx);
            throw e;
        }

        return transactionMapper.toResponseDTO(
                transactionRepository.save(tx)
        );
    }
*/

    @Override
    @Transactional
    public TransactionResponseDTO makeTransaction(@NotNull TransactionRequestDTO dto) {

        Account senderRef = resolveSenderAccount(dto);
        Account receiverRef = resolveReceiverAccount(dto);

        if (senderRef.getId().equals(receiverRef.getId())) {
            throw new InvalidDataException("Sender and receiver cannot be the same account");
        }

        LockedAccounts locked = lockAccountsInOrder(
                senderRef.getId(),
                receiverRef.getId()
        );

        Account sender = locked.sender();
        Account receiver = locked.receiver();

        BigDecimal senderBalance =
                ledgerRepository.calculateBalance(sender.getId());

        if (senderBalance.compareTo(dto.getAmount()) < 0) {
            throw new GlobalServiceException("Insufficient balance");
        }

        Transaction tx = transactionMapper.toEntity(dto);
        populateTransactionSnapshot(tx, sender, receiver);

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
            // setting the UpdatedBalance to accounts
            sender.setBalance(
                    ledgerRepository.calculateBalance(sender.getId())
            );
            receiver.setBalance(
                    ledgerRepository.calculateBalance(receiver.getId())
            );

        } catch (Exception ex) {
            tx.setStatus(Status.FAILED);
            transactionRepository.save(tx);
            throw ex;
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
       /* Account account = accountRepository.findAccountByAccountNumberAndEmail(accountNumber,email)
                .orElseThrow(()-> new ResourceNotFoundException("Transaction with account number "+accountNumber +" and email "+email+" not found"));
       */
        List<Transaction> transactions = transactionRepository.findTransactionByAccountNumberAndEmail(accountNumber,email);
        if ( transactions.isEmpty() )
            throw new ResourceNotFoundException("\"No transactions found for account number \" + accountNumber + \" and email \" + email);");
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

    /**
     * Populates transaction with denormalized snapshot data.
     * This captures the state of accounts at transaction time for historical accuracy.
     */
    private void populateTransactionSnapshot(
            Transaction tx,
            Account sender,
            Account receiver
    ) {
        tx.setSenderAccount(sender);
        tx.setReceiverAccount(receiver);
        tx.setSenderBank(sender.getBank());
        tx.setReceiverBank(receiver.getBank());

        tx.setSenderAccountNumber(sender.getAccountNumber());
        tx.setSenderEmail(sender.getCustomer().getEmail());
        tx.setSenderBankName(sender.getBank().getBankName());

        tx.setReceiverAccountNumber(receiver.getAccountNumber());
        tx.setReceiverEmail(receiver.getCustomer().getEmail());
        tx.setReceiverBankName(receiver.getBank().getBankName());
    }

    /**
     * Locks accounts in deterministic order to prevent deadlocks.
     * Always locks the account with lower ID first.
     */
    private LockedAccounts lockAccountsInOrder(Long senderId, Long receiverId) {

        Long firstId = senderId < receiverId ? senderId : receiverId;
        Long secondId = senderId < receiverId ? receiverId : senderId;

        Account first = accountRepository.lockById(firstId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        Account second = accountRepository.lockById(secondId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        Account sender = first.getId().equals(senderId) ? first : second;
        Account receiver = first.getId().equals(receiverId) ? first : second;

        return new LockedAccounts(sender, receiver);
    }

}

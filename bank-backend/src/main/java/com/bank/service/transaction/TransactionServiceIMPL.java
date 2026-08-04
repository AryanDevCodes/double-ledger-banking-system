package com.bank.service.transaction;

import com.bank.dto.PagedResponse;
import com.bank.dto.TransactionReceiptDTO;
import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Status;
import com.bank.entity.Transaction;
import com.bank.exception.GlobalServiceException;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.ledger.LedgerWriter;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.LedgerRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.transaction.mapper.TransactionMapper;
import com.bank.service.webhook.PaymentStatusEvent;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import java.util.stream.Collectors;

@Service
@Validated
@RequiredArgsConstructor
public class TransactionServiceIMPL implements TransactionService {

  private final TransactionRepository transactionRepository;
  private final TransactionMapper transactionMapper;
  private final AccountRepository accountRepository;
  private final LedgerWriter ledgerWriter;
  private final LedgerRepository ledgerRepository;
  private final CustomerRepository customerRepository;
  private final ApplicationEventPublisher eventPublisher;

  /*
   * @Override
   *
   * @Transactional
   * public TransactionResponseDTO makeTransaction(@NotNull TransactionRequestDTO
   * dto) {
   *
   * if (dto.getSenderAccount() == null || dto.getReceiverAccount() == null ||
   * dto.getAmount() == null) {
   * throw new InvalidDataException(
   * "Sender account, receiver account, and amount are required");
   * }
   *
   * Account senderAccount = resolveSenderAccount(dto);
   * Account receiverAccount = resolveReceiverAccount(dto);
   *
   * // Lock Sender account
   * accountRepository.lockById(senderAccount.getId());
   *
   * BigDecimal senderBalance =
   * ledgerRepository.calculateBalance(senderAccount.getId());
   * if (senderBalance.compareTo(dto.getAmount()) < 0) {
   * throw new GlobalServiceException("Insufficient balance");
   * }
   *
   * Transaction transaction = transactionMapper.toEntity(dto);
   * transaction.setSenderAccount(senderAccount);
   * transaction.setReceiverAccount(receiverAccount);
   * transaction.setSenderBank(senderAccount.getBank());
   * transaction.setReceiverBank(receiverAccount.getBank());
   * transaction.setAmount(dto.getAmount());
   * transaction.setStatus(Status.INITIATED);
   * transaction = transactionRepository.save(transaction);
   *
   * try {
   * // Ledger is the only writable
   * ledgerWriter.postDebit(
   * senderAccount.getId(),
   * dto.getAmount(),
   * transaction.getTransactionId().toString()
   * );
   * ledgerWriter.postCredit(
   * receiverAccount.getId(),
   * dto.getAmount(),
   * transaction.getTransactionId().toString()
   * );
   * transaction.setStatus(Status.COMPLETED);
   * } catch (Exception e) {
   * transaction.setStatus(Status.FAILED);
   * throw new GlobalServiceException("Transaction Failed", e);
   * }
   * return
   * transactionMapper.toResponseDTO(transactionRepository.save(transaction));
   * }
   */

  /*
   * @Override
   *
   * @Transactional
   * public TransactionResponseDTO makeTransaction(@NotNull TransactionRequestDTO
   * dto) {
   *
   * Account sender = accountRepository.lockById(
   * resolveSenderAccount(dto).getId()
   * ).orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
   * Account receiver =
   * accountRepository.lockById(resolveReceiverAccount(dto).getId())
   * .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));
   *
   * if (sender.getId().equals(receiver.getId())) {
   * throw new
   * InvalidDataException("Sender and receiver cannot be the same account");
   * }
   *
   * BigDecimal senderBalance = ledgerRepository.calculateBalance(sender.getId());
   * if (senderBalance.compareTo(dto.getAmount()) < 0) {
   * throw new GlobalServiceException("Insufficient balance");
   * }
   *
   * Transaction tx = transactionMapper.toEntity(dto);
   * tx.setSenderAccount(sender);
   * tx.setReceiverAccount(receiver);
   * tx.setSenderBank(sender.getBank());
   * tx.setReceiverBank(receiver.getBank());
   *
   * // Populate denormalized fields for fast queries and historical accuracy
   * tx.setSenderAccountNumber(sender.getAccountNumber());
   * tx.setSenderEmail(sender.getCustomer().getEmail());
   * tx.setSenderBankName(sender.getBank().getBankName());
   * tx.setReceiverAccountNumber(receiver.getAccountNumber());
   * tx.setReceiverEmail(receiver.getCustomer().getEmail());
   * tx.setReceiverBankName(receiver.getBank().getBankName());
   *
   * tx.setStatus(Status.INITIATED);
   * tx = transactionRepository.save(tx);
   *
   * try {
   * ledgerWriter.postDebit(
   * sender.getId(),
   * dto.getAmount(),
   * tx.getTransactionId().toString()
   * );
   *
   * ledgerWriter.postCredit(
   * receiver.getId(),
   * dto.getAmount(),
   * tx.getTransactionId().toString()
   * );
   *
   * tx.setStatus(Status.COMPLETED);
   * // Saving the updated balance to accountTable for a consistent view or a
   * // cached view
   * BigDecimal updatedSenderBalance =
   * ledgerRepository.calculateBalance(sender.getId());
   * BigDecimal updatedReceiverBalance =
   * ledgerRepository.calculateBalance(receiver.getId());
   *
   * sender.setBalance(updatedSenderBalance);
   * receiver.setBalance(updatedReceiverBalance);
   * } catch (Exception e) {
   * tx.setStatus(Status.FAILED);
   * transactionRepository.save(tx);
   * throw e;
   * }
   *
   * return transactionMapper.toResponseDTO(transactionRepository.save(tx));
   * }
   */

  @Override
  @Transactional
  public TransactionResponseDTO makeTransaction(TransactionRequestDTO dto) {
    Account senderRef = resolveSenderAccount(dto);
    Account receiverRef = resolveReceiverAccount(dto);
    enforceSenderOwnership(senderRef);

    if (senderRef.getId().equals(receiverRef.getId())) {
      throw new InvalidDataException("Sender and receiver cannot be the same account");
    }

    LockedAccounts locked = lockAccountsInOrder(senderRef.getId(), receiverRef.getId());
    Account sender = locked.sender();
    Account receiver = locked.receiver();

    if (sender.getStatus() != Status.ACTIVE) {
      throw new InvalidDataException(
          "Sender account is not active");
    }
    if (receiver.getStatus() != Status.ACTIVE) {
      throw new InvalidDataException(
          "Receiver account is not active");
    }

    requireKycVerified(sender, "sender");
    requireKycVerified(receiver, "receiver");

    BigDecimal senderBalance = ledgerRepository.calculateBalance(sender.getId());
    if (senderBalance.compareTo(dto.getAmount()) < 0) {
      throw new GlobalServiceException("Insufficient balance");
    }

    Transaction tx = transactionMapper.toEntity(dto);
    populateTransactionSnapshot(tx, sender, receiver);
    tx.setStatus(Status.INITIATED);
    tx = transactionRepository.save(tx);

    try {
      ledgerWriter.postDebit(sender.getId(), dto.getAmount(), tx.getTransactionId().toString());
      ledgerWriter.postCredit(receiver.getId(), dto.getAmount(), tx.getTransactionId().toString());
      tx.setStatus(Status.COMPLETED);
    } catch (Exception ex) {
      tx.setStatus(Status.FAILED);
      Transaction failed = transactionRepository.save(tx);
      publishStatusEvent("transaction.failed", failed);
      throw ex;
    }

    Transaction saved = transactionRepository.save(tx);
    publishStatusEvent("transaction.completed", saved);
    return transactionMapper.toResponseDTO(saved);
  }

  @Override
  @Transactional
  public TransactionResponseDTO reverseTransaction(Long transactionId, String reason) {
    if (transactionId == null) {
      throw new InvalidDataException("transactionId is required");
    }
    Transaction original = transactionRepository
        .findTransactionByTransactionId(transactionId)
        .orElseThrow(
            () -> new ResourceNotFoundException("Transaction", "id", transactionId.toString()));

    if (original.getStatus() != Status.COMPLETED) {
      throw new InvalidDataException(
          "Only COMPLETED transactions may be reversed (current=" + original.getStatus() + ")");
    }
    if (original.getReversalOfTransactionId() != null) {
      throw new InvalidDataException("Reversal entries cannot themselves be reversed");
    }

    // Lock both accounts in a deterministic order to avoid deadlocks.
    Long origSenderId = original.getSenderAccount().getId();
    Long origReceiverId = original.getReceiverAccount().getId();
    LockedAccounts locked = lockAccountsInOrder(origSenderId, origReceiverId);
    Account origSender = locked.sender();
    Account origReceiver = locked.receiver();

    if (origSender.getStatus() == Status.CLOSED || origReceiver.getStatus() == Status.CLOSED) {
      throw new InvalidDataException("Cannot reverse a transaction involving a CLOSED account");
    }

    // Ensure receiver has enough balance to give back; otherwise the reversal would
    // leave the ledger in an inconsistent state.
    BigDecimal receiverBalance = ledgerRepository.calculateBalance(origReceiver.getId());
    if (receiverBalance.compareTo(original.getAmount()) < 0) {
      throw new GlobalServiceException(
          "Cannot reverse: receiver does not have sufficient balance to refund");
    }

    // Build the compensating transaction: debit the original receiver, credit the
    // original sender.
    Transaction reversal = Transaction.builder()
        .senderAccount(origReceiver)
        .receiverAccount(origSender)
        .senderBank(origReceiver.getBank())
        .receiverBank(origSender.getBank())
        .senderName(origReceiver.getCustomer() != null ? origReceiver.getCustomer().getFullName() : null)
        .senderAccountNumber(origReceiver.getAccountNumber())
        .senderEmail(
            origReceiver.getCustomer() != null ? origReceiver.getCustomer().getEmail() : null)
        .senderBankName(origReceiver.getBank() != null ? origReceiver.getBank().getBankName() : null)
        .receiverName(origSender.getCustomer() != null ? origSender.getCustomer().getFullName() : null)
        .receiverAccountNumber(origSender.getAccountNumber())
        .receiverEmail(
            origSender.getCustomer() != null ? origSender.getCustomer().getEmail() : null)
        .receiverBankName(origSender.getBank() != null ? origSender.getBank().getBankName() : null)
        .amount(original.getAmount())
        .status(Status.INITIATED)
        .reversalOfTransactionId(original.getTransactionId())
        .reversalReason(reason)
        .build();
    reversal = transactionRepository.save(reversal);

    String refId = "REV-" + reversal.getTransactionId();
    try {
      ledgerWriter.postDebit(origReceiver.getId(), original.getAmount(), refId);
      ledgerWriter.postCredit(origSender.getId(), original.getAmount(), refId);
      reversal.setStatus(Status.COMPLETED);
    } catch (Exception ex) {
      reversal.setStatus(Status.FAILED);
      transactionRepository.save(reversal);
      throw ex;
    }

    // Mark the original transaction as REVERSED.
    original.setStatus(Status.REVERSED);
    if (reason != null)
      original.setReversalReason(reason);
    transactionRepository.save(original);

    Transaction savedReversal = transactionRepository.save(reversal);
    publishStatusEvent("transaction.reversed", original);
    return transactionMapper.toResponseDTO(savedReversal);
  }

  private void publishStatusEvent(String eventType, Transaction tx) {
    try {
      eventPublisher.publishEvent(
          PaymentStatusEvent.builder()
              .eventType(eventType)
              .transactionId(tx.getTransactionId())
              .senderAccountNumber(tx.getSenderAccountNumber())
              .receiverAccountNumber(tx.getReceiverAccountNumber())
              .amount(tx.getAmount())
              .status(tx.getStatus() != null ? tx.getStatus().name() : null)
              .occurredAt(LocalDateTime.now())
              .build());
    } catch (Exception ignored) {
      // Event publishing must never break the business transaction.
    }
  }

  private void requireKycVerified(Account account, String role) {
    if (account == null || account.getCustomer() == null) {
      throw new InvalidDataException("" + role + " account does not have a customer profile");
    }

    Status kycStatus = account.getCustomer().getKycStatus();
    boolean verified = kycStatus == Status.ACTIVE
        || kycStatus == Status.COMPLETED
        || kycStatus == Status.SUCCESS;
    if (!verified) {
      throw new InvalidDataException(
          role.substring(0, 1).toUpperCase() + role.substring(1)
              + " account is not KYC verified ",
          "kycStatus",
          kycStatus);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public List<TransactionResponseDTO> getAllTransactions(String accountNumber, String email) {
    if (accountNumber == null || email == null) {
      throw new InvalidDataException("please enter account number and email address");
    }

    // Get account to find its bank
    Account account = accountRepository.findByAccountNumber(accountNumber);
    if (account == null) {
      return List.of();
    }
    String bankName = account.getBank().getBankName();

    List<Transaction> transactions = transactionRepository
        .findTransactionByAccountNumberAndEmailAndBankNameWithDetails(accountNumber, email, bankName);
    if (transactions.isEmpty()) {
      return List.of();
    }

    return transactions.stream()
        .map(transactionMapper::toResponseDTO)
        .collect(java.util.stream.Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public List<TransactionResponseDTO> getAllTransactionsWithoutFilter() {
    // Allow admins to see all transactions system-wide
    if (isAdminUser()) {
      List<Transaction> transactions = transactionRepository.findAll();
      return transactions.stream()
          .map(transactionMapper::toResponseDTO)
          .collect(Collectors.toList());
    }

    // For non-admins, scope to their own transactions using a targeted query
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getName() == null) {
      return List.of();
    }
    List<Account> accounts = accountRepository.findByCustomerUserUsername(auth.getName());
    if (accounts.isEmpty()) {
      return List.of();
    }
    String email = accounts.get(0).getCustomer().getEmail();
    return accounts.stream()
        .flatMap(acc -> transactionRepository
            .findTransactionByAccountNumberAndEmailAndBankNameWithDetails(
                acc.getAccountNumber(), email, acc.getBank().getBankName())
            .stream())
        .distinct()
        .map(transactionMapper::toResponseDTO)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public PagedResponse<TransactionResponseDTO> getAllTransactionsPaginated(Pageable pageable) {
    if (!isAdminUser()) {
      throw new AccessDeniedException("Only admins can access paginated transactions");
    }
    Page<Transaction> transactionPage = transactionRepository.findAll(pageable);
    List<TransactionResponseDTO> content = transactionPage.getContent().stream()
        .map(transactionMapper::toResponseDTO)
        .collect(Collectors.toList());
    return PagedResponse.of(content, pageable.getPageNumber(), pageable.getPageSize(),
        transactionPage.getTotalElements());
  }

  @Override
  @Transactional(readOnly = true)
  public List<TransactionResponseDTO> getTransactionsForUser(Long userId) {
    if (userId == null) {
      throw new InvalidDataException("User ID is required");
    }

    // Allow admins to see all transactions for any user
    if (isAdminUser()) {
      var customers = customerRepository.findByUserId(userId);
      if (customers.isEmpty()) {
        return List.of();
      }

      // Get all transactions and filter by customer (null-safe)
      List<Transaction> allTransactions = transactionRepository.findAll().stream()
          .filter(t -> {
            boolean senderMatch = t.getSenderAccount() != null
                && t.getSenderAccount().getCustomer() != null
                && t.getSenderAccount().getCustomer().getUser() != null
                && userId.equals(t.getSenderAccount().getCustomer().getUser().getId());
            boolean receiverMatch = t.getReceiverAccount() != null
                && t.getReceiverAccount().getCustomer() != null
                && t.getReceiverAccount().getCustomer().getUser() != null
                && userId.equals(t.getReceiverAccount().getCustomer().getUser().getId());
            return senderMatch || receiverMatch;
          })
          .sorted((a, b) -> {
            if (a.getTransactionDate() == null && b.getTransactionDate() == null)
              return 0;
            if (a.getTransactionDate() == null)
              return 1;
            if (b.getTransactionDate() == null)
              return -1;
            return b.getTransactionDate().compareTo(a.getTransactionDate());
          })
          .collect(Collectors.toList());

      return allTransactions.stream()
          .map(transactionMapper::toResponseDTO)
          .collect(Collectors.toList());
    }

    var customers = customerRepository.findByUserId(userId);
    if (customers.isEmpty()) {
      return List.of();
    }

    // Load ALL user accounts across all banks to show transactions for all accounts
    List<Account> accounts = accountRepository.findByCustomerUserId(userId);
    if (accounts.isEmpty()) {
      return List.of();
    }

    String email = customers.get(0).getEmail();
    List<Transaction> allTransactions = accounts.stream()
        .flatMap(
            acc -> transactionRepository
                .findTransactionByAccountNumberAndEmailAndBankNameWithDetails(
                    acc.getAccountNumber(), email, acc.getBank().getBankName())
                .stream())
        .distinct()
        .sorted((a, b) -> {
          if (a.getTransactionDate() == null && b.getTransactionDate() == null)
            return 0;
          if (a.getTransactionDate() == null)
            return 1;
          if (b.getTransactionDate() == null)
            return -1;
          return b.getTransactionDate().compareTo(a.getTransactionDate());
        })
        .toList();

    return allTransactions.stream()
        .map(transactionMapper::toResponseDTO)
        .collect(java.util.stream.Collectors.toList());
  }

  /**
   * Check if current user has ROLE_ADMIN
   */
  private boolean isAdminUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) {
      return false;
    }
    return auth.getAuthorities().stream()
        .anyMatch(grantedAuth -> "ROLE_ADMIN".equals(grantedAuth.getAuthority()));
  }

  @Override
  @Transactional(readOnly = true)
  public List<TransactionResponseDTO> getTransactionsForCustomer(String customerId) {
    if (customerId == null || customerId.isBlank()) {
      throw new InvalidDataException("Customer ID is required");
    }

    Customer customer = customerRepository.findById(customerId)
        .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

    List<Account> accounts = accountRepository.findByCustomerId(customerId);
    if (accounts.isEmpty()) {
      return List.of();
    }

    String email = customer.getEmail();
    List<Transaction> allTransactions = accounts.stream()
        .flatMap(
            acc -> transactionRepository
                .findTransactionByAccountNumberAndEmailAndBankNameWithDetails(
                    acc.getAccountNumber(), email, acc.getBank().getBankName())
                .stream())
        .distinct()
        .sorted((a, b) -> {
          if (a.getTransactionDate() == null && b.getTransactionDate() == null)
            return 0;
          if (a.getTransactionDate() == null)
            return 1;
          if (b.getTransactionDate() == null)
            return -1;
          return b.getTransactionDate().compareTo(a.getTransactionDate());
        })
        .toList();

    return allTransactions.stream()
        .map(transactionMapper::toResponseDTO)
        .collect(java.util.stream.Collectors.toList());
  }

  private Account resolveSenderAccount(TransactionRequestDTO dto) {
    if (dto.getSenderAccount() == null || dto.getSenderAccount().isBlank()) {
      throw new InvalidDataException(
          "senderAccount (account number) is required to initiate a transfer");
    }
    Account senderAccount = accountRepository.findByAccountNumber(dto.getSenderAccount());
    if (senderAccount == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", dto.getSenderAccount());
    }
    return senderAccount;
  }

  private Account resolveReceiverAccount(TransactionRequestDTO dto) {
    if (dto.getReceiverAccount() == null || dto.getReceiverAccount().isBlank()) {
      throw new InvalidDataException(
          "receiverAccount (account number) is required to initiate a transfer");
    }
    Account receiverAccount = accountRepository.findByAccountNumber(dto.getReceiverAccount());
    if (receiverAccount == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", dto.getReceiverAccount());
    }
    return receiverAccount;
  }

  /**
   * Populates transaction with denormalized snapshot data. This captures the
   * state of accounts at
   * transaction time for historical accuracy.
   */
  private void populateTransactionSnapshot(Transaction tx, Account sender, Account receiver) {
    tx.setSenderAccount(sender);
    tx.setReceiverAccount(receiver);
    tx.setSenderBank(sender.getBank());
    tx.setReceiverBank(receiver.getBank());
    tx.setSenderName(sender.getCustomer().getFullName());
    tx.setSenderAccountNumber(sender.getAccountNumber());
    tx.setSenderEmail(sender.getCustomer().getEmail());
    tx.setSenderBankName(sender.getBank().getBankName());
    tx.setReceiverName(receiver.getCustomer().getFullName());
    tx.setReceiverAccountNumber(receiver.getAccountNumber());
    tx.setReceiverEmail(receiver.getCustomer().getEmail());
    tx.setReceiverBankName(receiver.getBank().getBankName());
  }

  /** Locks accounts in deterministic order to prevent deadlocks. */
  private LockedAccounts lockAccountsInOrder(Long senderId, Long receiverId) {
    Long firstId = senderId < receiverId ? senderId : receiverId;
    Long secondId = senderId < receiverId ? receiverId : senderId;

    Account first = accountRepository
        .lockById(firstId)
        .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    Account second = accountRepository
        .lockById(secondId)
        .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

    Account sender = first.getId().equals(senderId) ? first : second;
    Account receiver = first.getId().equals(receiverId) ? first : second;
    return new LockedAccounts(sender, receiver);
  }

  private void enforceSenderOwnership(Account senderAccount) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new AccessDeniedException("Authentication required to create transaction");
    }

    String principal = authentication.getName();
    if (principal == null || principal.isBlank()) {
      throw new AccessDeniedException("Authenticated principal is invalid");
    }

    String ownerUsername = senderAccount.getCustomer() != null && senderAccount.getCustomer().getUser() != null
        ? senderAccount.getCustomer().getUser().getUsername()
        : null;
    String ownerEmail = senderAccount.getCustomer() != null ? senderAccount.getCustomer().getEmail() : null;
    boolean isOwner = principal.equalsIgnoreCase(ownerUsername) || principal.equalsIgnoreCase(ownerEmail);
    if (!isOwner) {
      throw new AccessDeniedException("You can only transfer funds from your own account");
    }
  }

  @Override
  @Transactional(readOnly = true)
  public TransactionReceiptDTO getReceipt(Long transactionId, Long userId) {
    Transaction tx = transactionRepository.findById(transactionId)
        .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

    Account senderAccount = tx.getSenderAccount();
    Account receiverAccount = tx.getReceiverAccount();

    BigDecimal senderBalanceBefore = BigDecimal.ZERO;
    BigDecimal senderBalanceAfter = BigDecimal.ZERO;
    BigDecimal receiverBalanceBefore = BigDecimal.ZERO;
    BigDecimal receiverBalanceAfter = BigDecimal.ZERO;

    if (senderAccount != null) {
      senderBalanceAfter = ledgerRepository.calculateBalance(senderAccount.getId());
      senderBalanceBefore = senderBalanceAfter.add(tx.getAmount());
    }
    if (receiverAccount != null) {
      receiverBalanceBefore = ledgerRepository.calculateBalance(receiverAccount.getId());
      receiverBalanceAfter = receiverBalanceBefore.subtract(tx.getAmount());
    }

    String senderName = senderAccount != null && senderAccount.getCustomer() != null
        ? senderAccount.getCustomer().getFullName()
        : "Unknown";
    String receiverName = receiverAccount != null && receiverAccount.getCustomer() != null
        ? receiverAccount.getCustomer().getFullName()
        : "Unknown";

    return TransactionReceiptDTO.builder()
        .receiptId("RCT-" + tx.getTransactionId() + "-" + System.currentTimeMillis())
        .transactionId(tx.getTransactionId())
        .transactionType("TRANSFER")
        .status(tx.getStatus() != null ? tx.getStatus().name() : "UNKNOWN")
        .amount(tx.getAmount())
        .currency("INR")
        .senderName(senderName)
        .senderAccountNumber(tx.getSenderAccountNumber())
        .senderBankName(senderAccount != null && senderAccount.getBank() != null
            ? senderAccount.getBank().getBankName()
            : "Unknown")
        .senderIfsc(senderAccount != null && senderAccount.getBank() != null ? senderAccount.getBank().getIfscCode()
            : "Unknown")
        .receiverName(receiverName)
        .receiverAccountNumber(tx.getReceiverAccountNumber())
        .receiverBankName(receiverAccount != null && receiverAccount.getBank() != null
            ? receiverAccount.getBank().getBankName()
            : "Unknown")
        .receiverIfsc(
            receiverAccount != null && receiverAccount.getBank() != null ? receiverAccount.getBank().getIfscCode()
                : "Unknown")
        .description("Transfer")
        .referenceId(tx.getTransactionId().toString())
        .transactionDate(tx.getTransactionDate())
        .completedDate(tx.getTransactionDate())
        .senderBalanceBefore(senderBalanceBefore)
        .senderBalanceAfter(senderBalanceAfter)
        .receiverBalanceBefore(receiverBalanceBefore)
        .receiverBalanceAfter(receiverBalanceAfter)
        .reversalReason(tx.getReversalReason())
        .isReversed(tx.getStatus() == Status.REVERSED)
        .build();
  }
}

package com.bank.service.composite;

import com.bank.dto.account.AccountResponseDTO;
import com.bank.dto.account.AccountComplianceUpdateRequestDTO;
import com.bank.dto.composite.AccountBalanceDTO;
import com.bank.dto.composite.AccountOverviewDTO;
import com.bank.dto.composite.ActionResultDTO;
import com.bank.dto.composite.BankOperationsSummaryDTO;
import com.bank.dto.composite.CustomerBankingProfileDTO;
import com.bank.dto.composite.GlobalSearchResultDTO;
import com.bank.dto.composite.TransferReceiptDTO;
import com.bank.dto.bank.BankResponseDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.dto.upi.UpiProfileResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Status;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.LedgerRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.account.AccountsService;
import com.bank.service.account.mapper.AccountMapper;
import com.bank.service.bank.BankService;
import com.bank.service.customer.CustomerService;
import com.bank.service.customer.mapper.CustomerMapper;
import com.bank.service.transaction.TransactionService;
import com.bank.service.transaction.mapper.TransactionMapper;
import com.bank.service.upi.UpiService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompositeBankingService {

    private static final int RECENT_TRANSACTIONS_LIMIT = 10;

    private final AccountsService accountsService;
    private final TransactionService transactionService;
    private final UpiService upiService;
    private final CustomerService customerService;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final LedgerRepository ledgerRepository;
    private final TransactionRepository transactionRepository;
    private final BankService bankService;
    private final TransactionMapper transactionMapper;
    private final AccountMapper accountMapper;
    private final CustomerMapper customerMapper;

    /**
     * Returns accounts + live balances + recent transactions + UPI profiles for
     * the authenticated user in a single call.
     */
    @Transactional(readOnly = true)
    public AccountOverviewDTO getMyOverview(Long userId) {
        List<AccountResponseDTO> accounts = accountsService.findByUserId(userId);

        BigDecimal totalBalance = accounts.stream()
                .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TransactionResponseDTO> allTxns = transactionService.getTransactionsForUser(userId);
        List<TransactionResponseDTO> recentTxns = allTxns.stream()
                .limit(RECENT_TRANSACTIONS_LIMIT)
                .toList();

        List<UpiProfileResponseDTO> upiProfiles = upiService.getUpiProfilesForUser(userId);

        long activeUpi = upiProfiles.stream()
                .filter(u -> Status.ACTIVE.equals(u.getStatus()))
                .count();

        return AccountOverviewDTO.builder()
                .accounts(accounts)
                .totalBalance(totalBalance)
                .totalAccounts(accounts.size())
                .recentTransactions(recentTxns)
                .totalTransactions(allTxns.size())
                .upiProfiles(upiProfiles)
                .activeUpiProfiles((int) activeUpi)
                .build();
    }

    /**
     * Phase 1 - Composite 2:
     * Validates, executes a bank transfer, then returns the transaction receipt
     * with updated balances for sender and receiver — all in one call.
     */
    @Transactional
    public TransferReceiptDTO comprehensiveTransfer(TransactionRequestDTO dto) {
        TransactionResponseDTO transaction = transactionService.makeTransaction(dto);

        Account senderAccount = accountRepository.findByAccountNumber(dto.getSenderAccount());
        Account receiverAccount = accountRepository.findByAccountNumber(dto.getReceiverAccount());

        BigDecimal senderBalance = senderAccount != null
                ? ledgerRepository.calculateBalance(senderAccount.getId())
                : null;
        BigDecimal receiverBalance = receiverAccount != null
                ? ledgerRepository.calculateBalance(receiverAccount.getId())
                : null;

        return TransferReceiptDTO.builder()
                .transaction(transaction)
                .senderAccountNumber(dto.getSenderAccount())
                .receiverAccountNumber(dto.getReceiverAccount())
                .senderNewBalance(senderBalance)
                .receiverNewBalance(receiverBalance)
                .processedAt(LocalDateTime.now())
                .status(transaction.getStatus() != null ? transaction.getStatus().name() : "UNKNOWN")
                .build();
    }

    /**
     * Phase 2 - Composite 4:
     * Returns bank metadata + account count + customer count + total balance
     * + transaction stats — for management reporting in one call.
     */
    @Transactional(readOnly = true)
    public BankOperationsSummaryDTO getBankOperationsSummary(String bankId) {
        BankResponseDTO bank = bankService.findById(bankId);
        String bankName = bank.getBankName();

        List<Account> accounts = accountRepository.findByBankBankName(bankName);

        BigDecimal totalBalance = accounts.stream()
                .map(a -> ledgerRepository.calculateBalance(a.getId()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long customerCount = accounts.stream()
                .map(a -> a.getCustomer() != null ? a.getCustomer().getId() : null)
                .filter(id -> id != null)
                .distinct()
                .count();

        long totalTxns = transactionRepository.countByBankName(bankName);
        long completedTxns = transactionRepository.countByBankNameAndStatus(bankName, Status.COMPLETED);
        long reversedTxns = transactionRepository.countByBankNameAndStatus(bankName, Status.REVERSED);
        long failedTxns = transactionRepository.countByBankNameAndStatus(bankName, Status.FAILED);

        return BankOperationsSummaryDTO.builder()
                .bank(bank)
                .totalAccounts(accounts.size())
                .totalCustomers((int) customerCount)
                .totalBalance(totalBalance)
                .totalTransactions(totalTxns)
                .completedTransactions(completedTxns)
                .reversedTransactions(reversedTxns)
                .failedTransactions(failedTxns)
                .build();
    }

    /**
     * Phase 2 - Composite 5:
     * Checks live ledger balances for a batch of account numbers in one call.
     * Returns per-account balance with error handling for unknown accounts.
     */
    @Transactional(readOnly = true)
    public List<AccountBalanceDTO> batchBalanceCheck(List<String> accountNumbers) {
        List<AccountBalanceDTO> results = new ArrayList<>();
        for (String accNum : accountNumbers) {
            try {
                Account account = accountRepository.findByAccountNumber(accNum);
                if (account == null) {
                    results.add(AccountBalanceDTO.builder()
                            .accountNumber(accNum)
                            .errorMessage("Account not found")
                            .build());
                } else {
                    BigDecimal balance = ledgerRepository.calculateBalance(account.getId());
                    results.add(AccountBalanceDTO.builder()
                            .accountNumber(accNum)
                            .balance(balance)
                            .bankName(account.getBank() != null ? account.getBank().getBankName() : null)
                            .status(account.getStatus() != null ? account.getStatus().name() : null)
                            .build());
                }
            } catch (Exception e) {
                results.add(AccountBalanceDTO.builder()
                        .accountNumber(accNum)
                        .errorMessage("Error fetching balance: " + e.getMessage())
                        .build());
            }
        }
        return results;
    }

    /**
     * Phase 2 - Composite 6:
     * Advanced transaction search with optional date range, amount range,
     * status, and bank name filters — all in one parameterised call.
     */
    @Transactional(readOnly = true)
    public List<com.bank.dto.transaction.TransactionResponseDTO> advancedTransactionSearch(
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            BigDecimal amountMin,
            BigDecimal amountMax,
            Status status,
            String bankName) {
        return transactionRepository
                .searchAdvanced(dateFrom, dateTo, amountMin, amountMax, status, bankName)
                .stream()
                .map(transactionMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerBankingProfileDTO getCustomerBankingProfile(String customerId) {
        var customers = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        CustomerResponseDTO customerDTO = customerService.findCustomerByEmail(customers.getEmail());

        List<Account> accountEntities = accountRepository.findByCustomerId(customerId);

        List<AccountResponseDTO> accountDTOs = accountEntities.stream()
                .map(a -> accountsService.findByAccountNumber(a.getAccountNumber()))
                .toList();

        BigDecimal totalBalance = accountDTOs.stream()
                .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TransactionResponseDTO> allTxns = transactionService.getTransactionsForCustomer(customerId);
        List<TransactionResponseDTO> recentTxns = allTxns.stream()
                .limit(RECENT_TRANSACTIONS_LIMIT)
                .toList();

        List<UpiProfileResponseDTO> upiProfiles = accountEntities.stream()
                .flatMap(a -> upiService.getUpiProfilesByAccountNumber(a.getAccountNumber()).stream())
                .distinct()
                .toList();

        return CustomerBankingProfileDTO.builder()
                .customer(customerDTO)
                .accounts(accountDTOs)
                .totalBalance(totalBalance)
                .recentTransactions(recentTxns)
                .totalTransactions(allTxns.size())
                .upiProfiles(upiProfiles)
                .totalAccounts(accountDTOs.size())
                .build();
    }

    /**
     * Phase 3 - Composite 7: Global Search
     * Searches customers, accounts and transactions in one call using a
     * single query string. All three entity types are searched in parallel
     * via stream and returned in a unified result.
     */
    @Transactional(readOnly = true)
    public GlobalSearchResultDTO globalSearch(String q) {
        if (q == null || q.isBlank()) {
            return GlobalSearchResultDTO.builder()
                    .query(q)
                    .customers(List.of())
                    .accounts(List.of())
                    .transactions(List.of())
                    .totalResults(0)
                    .build();
        }
        String term = q.trim();

        var customers = customerRepository.searchByQuery(term).stream()
                .map(customerMapper::toResponseDTO)
                .toList();

        var accounts = accountRepository.searchByQuery(term).stream()
                .map(accountMapper::toResponseDTO)
                .toList();

        var transactions = transactionRepository.searchByQuery(term).stream()
                .map(transactionMapper::toResponseDTO)
                .toList();

        return GlobalSearchResultDTO.builder()
                .query(term)
                .customers(customers)
                .accounts(accounts)
                .transactions(transactions)
                .totalResults(customers.size() + accounts.size() + transactions.size())
                .build();
    }

    /**
     * Phase 3 - Composite 8: Freeze Account
     * Sets account status to BLOCKED, persists via compliance update, and
     * writes an audit log entry — all in a single atomic call.
     */
    @Transactional
    public ActionResultDTO freezeAccount(
            String accountNumber, String reason, HttpServletRequest request) {
        AccountComplianceUpdateRequestDTO compliance = new AccountComplianceUpdateRequestDTO();
        compliance.setAccountStatus(com.bank.entity.Status.BLOCKED);
        accountsService.updateAccountCompliance(accountNumber, compliance);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actor = auth != null ? auth.getName() : "system";

        return ActionResultDTO.builder()
                .success(true)
                .message(reason != null && !reason.isBlank()
                        ? "Account frozen: " + reason
                        : "Account frozen successfully")
                .resourceId(accountNumber)
                .newStatus(com.bank.entity.Status.BLOCKED.name())
                .performedAt(LocalDateTime.now())
                .performedBy(actor)
                .build();
    }

    /**
     * Phase 3 - Composite 9: KYC Verify
     * Sets KYC status to ACTIVE on all accounts belonging to the customer,
     * and writes an audit log entry — all in a single atomic call.
     */
    @Transactional
    public ActionResultDTO kycVerify(
            String customerId, HttpServletRequest request) {
        var customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        List<Account> accounts = accountRepository.findByCustomerId(customerId);
        for (Account acc : accounts) {
            AccountComplianceUpdateRequestDTO compliance = new AccountComplianceUpdateRequestDTO();
            compliance.setKycStatus(com.bank.entity.Status.ACTIVE);
            compliance.setCustomerStatus(com.bank.entity.Status.ACTIVE);
            accountsService.updateAccountCompliance(acc.getAccountNumber(), compliance);
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actor = auth != null ? auth.getName() : "system";

        return ActionResultDTO.builder()
                .success(true)
                .message("KYC verified for customer: " + customer.getFullName())
                .resourceId(customerId)
                .newStatus(com.bank.entity.Status.ACTIVE.name())
                .performedAt(LocalDateTime.now())
                .performedBy(actor)
                .build();
    }
}

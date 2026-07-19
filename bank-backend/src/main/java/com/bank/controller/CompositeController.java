package com.bank.controller;

import com.bank.dto.composite.AccountBalanceDTO;
import com.bank.dto.composite.AccountOverviewDTO;
import com.bank.dto.composite.ActionResultDTO;
import com.bank.dto.composite.BankOperationsSummaryDTO;
import com.bank.dto.composite.CustomerBankingProfileDTO;
import com.bank.dto.composite.GlobalSearchResultDTO;
import com.bank.dto.composite.TransferReceiptDTO;
import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Status;
import com.bank.security.JwtUtil;
import com.bank.service.composite.CompositeBankingService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Composite Endpoints — groups multiple related operations into
 * single API calls to reduce round-trips and simplify frontend code.
 */
@RestController
@RequestMapping("/composite")
@RequiredArgsConstructor
public class CompositeController {

  private final CompositeBankingService compositeBankingService;
  private final JwtUtil jwtUtil;

  /**
   * Composite 1: My Account Overview
   * Returns all accounts + balances + recent transactions + UPI profiles
   * for the authenticated user in one call.
   *
   * Replaces:
   * GET /account/my
   * GET /transaction/accounts/{id}/balance (for each account)
   * GET /transaction/my
   * GET /upi/my
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping("/my/overview")
  public ResponseEntity<AccountOverviewDTO> getMyOverview(
      @RequestHeader("Authorization") String authHeader) {
    Long userId = jwtUtil.extractUserId(authHeader.substring(7));
    return ResponseEntity.ok(compositeBankingService.getMyOverview(userId));
  }

  /**
   * Composite 2: Comprehensive Transfer
   * Validates, executes a bank transfer and returns receipt with updated
   * balances for sender and receiver — all in one call.
   *
   * Replaces:
   * GET /account/validate-receiver
   * POST /transaction
   * GET /transaction/accounts/{id}/balance
   */
  @PreAuthorize("hasRole('ROLE_USER')")
  @PostMapping("/transfer")
  public ResponseEntity<TransferReceiptDTO> comprehensiveTransfer(
      @RequestBody TransactionRequestDTO dto) {
    return ResponseEntity.ok(compositeBankingService.comprehensiveTransfer(dto));
  }

  /**
   * Composite 3: Customer Banking Profile (staff use)
   * Returns full customer info + accounts + balance + recent transactions
   * + UPI profiles in a single call.
   *
   * Replaces:
   * GET /customer/email/{email}
   * GET /account/email/{email}
   * GET /transaction/customer/{customerId}
   * GET /upi/account/{accountNumber} (for each account)
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/customers/{customerId}/banking-profile")
  public ResponseEntity<CustomerBankingProfileDTO> getCustomerBankingProfile(
      @PathVariable String customerId) {
    return ResponseEntity.ok(compositeBankingService.getCustomerBankingProfile(customerId));
  }

  /**
   * Composite 4: Bank Operations Summary
   * Returns bank info + account count + customer count + total balance +
   * transaction
   * stats in one call. Replaces: GET /bank/{id} + GET /account/name/{bankName}
   * + GET /customer/bank + GET /transaction/all (filtered).
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/banks/{bankId}/operations-summary")
  public ResponseEntity<BankOperationsSummaryDTO> getBankOperationsSummary(
      @PathVariable String bankId) {
    return ResponseEntity.ok(compositeBankingService.getBankOperationsSummary(bankId));
  }

  /**
   * Composite 5: Batch Balance Check
   * Check live ledger balances for multiple account numbers in one call.
   * Replaces: GET /transaction/accounts/{id}/balance (called per account).
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @PostMapping("/accounts/balance-check")
  public ResponseEntity<List<AccountBalanceDTO>> batchBalanceCheck(
      @RequestBody List<String> accountNumbers) {
    return ResponseEntity.ok(compositeBankingService.batchBalanceCheck(accountNumbers));
  }

  /**
   * Composite 6: Advanced Transaction Search
   * Flexible search with optional date range, amount range, status, and bank
   * name. All params are optional — omit any to search without that filter.
   * Replaces multiple filtered calls to GET /transaction or GET /transaction/all.
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_CUSTOMER_MANAGER')")
  @GetMapping("/transactions/advanced")
  public ResponseEntity<List<TransactionResponseDTO>> advancedTransactionSearch(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
      @RequestParam(required = false) BigDecimal amountMin,
      @RequestParam(required = false) BigDecimal amountMax,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String bankName) {
    Status parsedStatus = null;
    if (status != null && !status.isBlank()) {
      try {
        parsedStatus = Status.valueOf(status.toUpperCase());
      } catch (IllegalArgumentException ignored) {
      }
    }
    return ResponseEntity.ok(compositeBankingService.advancedTransactionSearch(
        dateFrom, dateTo, amountMin, amountMax, parsedStatus, bankName));
  }

  /**
   * Composite 7: Global Search
   * Searches customers, accounts and transactions in one call.
   * ?q= is the search term. All entity types are included in the response.
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/search/global")
  public ResponseEntity<GlobalSearchResultDTO> globalSearch(@RequestParam String q) {
    return ResponseEntity.ok(compositeBankingService.globalSearch(q));
  }

  /**
   * Composite 8: Freeze Account
   * Sets account to BLOCKED + logs audit in one call.
   * Optional body: { "reason": "..." }
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  @PostMapping("/accounts/{accountNumber}/freeze")
  public ResponseEntity<ActionResultDTO> freezeAccount(
      @PathVariable String accountNumber,
      @RequestBody(required = false) Map<String, String> body,
      HttpServletRequest request) {
    String reason = body != null ? body.get("reason") : null;
    return ResponseEntity.ok(compositeBankingService.freezeAccount(accountNumber, reason, request));
  }

  /**
   * Composite 9: KYC Verify
   * Sets KYC + customer status to ACTIVE for all customer accounts + logs audit.
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER')")
  @PostMapping("/customers/{customerId}/kyc-verify")
  public ResponseEntity<ActionResultDTO> kycVerify(
      @PathVariable String customerId,
      HttpServletRequest request) {
    return ResponseEntity.ok(compositeBankingService.kycVerify(customerId, request));
  }
}

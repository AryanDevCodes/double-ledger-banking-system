package com.bank.controller;

import com.bank.dto.PagedResponse;
import com.bank.dto.TransactionReceiptDTO;
import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.repository.LedgerRepository;
import com.bank.security.JwtUtil;
import com.bank.service.transaction.TransactionService;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
public class TransactionController {
  private final TransactionService transactionService;
  private final LedgerRepository ledgerRepository;
  private final JwtUtil jwtUtil;

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_CUSTOMER_MANAGER')")
  @GetMapping("/all")
  public ResponseEntity<List<TransactionResponseDTO>> getAllTransactions() {
    return ResponseEntity.ok(transactionService.getAllTransactionsWithoutFilter());
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_CUSTOMER_MANAGER')")
  @GetMapping("/all/paginated")
  public ResponseEntity<PagedResponse<TransactionResponseDTO>> getTransactionsPaginated(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "transactionId") String sortBy,
      @RequestParam(defaultValue = "desc") String sortDir) {
    Sort sort = sortDir.equalsIgnoreCase("desc")
        ? Sort.by(sortBy).descending()
        : Sort.by(sortBy).ascending();
    return ResponseEntity.ok(transactionService.getAllTransactionsPaginated(PageRequest.of(page, size, sort)));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping
  public ResponseEntity<List<TransactionResponseDTO>> getTransactions(
      @RequestParam String accountNumber, @RequestParam String email) {
    return ResponseEntity.ok(transactionService.getAllTransactions(accountNumber, email));
  }

  @PreAuthorize("hasRole('ROLE_USER')")
  @PostMapping
  public ResponseEntity<TransactionResponseDTO> createTransaction(
      @RequestBody TransactionRequestDTO transactionRequestDTO) {
    return ResponseEntity.ok(transactionService.makeTransaction(transactionRequestDTO));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping("/accounts/{id}/balance")
  public BigDecimal getBalance(@PathVariable Long id) {
    return ledgerRepository.calculateBalance(id);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping("/my")
  public ResponseEntity<List<TransactionResponseDTO>> getMyTransactions(
      @RequestHeader("Authorization") String authHeader) {
    String token = authHeader.substring(7);
    Long userId = jwtUtil.extractUserId(token);
    return ResponseEntity.ok(transactionService.getTransactionsForUser(userId));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_CUSTOMER_MANAGER')")
  @GetMapping("/customer/{customerId}")
  public ResponseEntity<List<TransactionResponseDTO>> getCustomerTransactions(
      @PathVariable String customerId) {
    return ResponseEntity.ok(transactionService.getTransactionsForCustomer(customerId));
  }

  /**
   * Reverse / refund a previously COMPLETED transaction. Posts compensating
   * ledger entries and
   * marks the original as REVERSED. Restricted to admin/manager roles.
   */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  @PostMapping("/{transactionId}/reverse")
  public ResponseEntity<TransactionResponseDTO> reverseTransaction(
      @PathVariable Long transactionId,
      @RequestParam(value = "reason", required = false) String reason) {
    return ResponseEntity.ok(transactionService.reverseTransaction(transactionId, reason));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER', 'ROLE_AUDITOR', 'ROLE_CUSTOMER_MANAGER')")
  @GetMapping("/{transactionId}/receipt")
  public ResponseEntity<TransactionReceiptDTO> getReceipt(
      @PathVariable Long transactionId,
      HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");
    Long userId = jwtUtil.extractUserId(authHeader.substring(7));
    return ResponseEntity.ok(transactionService.getReceipt(transactionId, userId));
  }
}

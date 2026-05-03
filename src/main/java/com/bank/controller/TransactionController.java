package com.bank.controller;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.repository.LedgerRepository;
import com.bank.security.JwtUtil;
import com.bank.service.transaction.TransactionService;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
public
class TransactionController {
  private final TransactionService transactionService;
  private final LedgerRepository ledgerRepository;
  private final JwtUtil jwtUtil;

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/all")
  public ResponseEntity<List<TransactionResponseDTO>> getAllTransactions() {
    return ResponseEntity.ok(transactionService.getAllTransactionsWithoutFilter());
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping
  public ResponseEntity<List<TransactionResponseDTO>> getTransactions(
      @RequestParam String accountNumber, String email) {
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
}

package com.bank.controller;

import com.bank.dto.PagedResponse;
import com.bank.dto.account.AccountComplianceUpdateRequestDTO;
import com.bank.dto.account.AccountLedgerBalanceDTO;
import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.dto.account.ReceiverValidationResponseDTO;
import com.bank.security.JwtUtil;
import com.bank.service.account.AccountsService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountController {

  private final AccountsService accountsService;
  private final JwtUtil jwtUtil;

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping
  public ResponseEntity<List<AccountResponseDTO>> getAllAccounts() {
    return ResponseEntity.ok(accountsService.findAll());
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/paginated")
  public ResponseEntity<PagedResponse<AccountResponseDTO>> getAccountsPaginated(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "accountNumber") String sortBy,
      @RequestParam(defaultValue = "asc") String sortDir) {
    Sort sort = sortDir.equalsIgnoreCase("desc")
        ? Sort.by(sortBy).descending()
        : Sort.by(sortBy).ascending();
    return ResponseEntity.ok(accountsService.findAllPaginated(PageRequest.of(page, size, sort)));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR',"
      + " 'ROLE_USER')")
  @GetMapping("/my")
  public ResponseEntity<List<AccountResponseDTO>> getMyAccounts(
      @RequestHeader("Authorization") String authHeader) {
    String token = authHeader.substring(7); // Remove "Bearer " prefix
    Long userId = jwtUtil.extractUserId(token);
    return ResponseEntity.ok(accountsService.findByUserId(userId));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/{id}")
  public ResponseEntity<AccountResponseDTO> getAccount(@PathVariable String id) {
    return ResponseEntity.ok(accountsService.findByAccountNumber(id));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/name/{bankName}")
  public ResponseEntity<List<AccountResponseDTO>> getAccountsByBankName(
      @PathVariable String bankName) {
    return ResponseEntity.ok(accountsService.findByBank(bankName));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER')")
  @GetMapping("/email/{email}")
  public ResponseEntity<List<AccountResponseDTO>> getAccountsByEmail(@PathVariable String email) {
    return ResponseEntity.ok(accountsService.findByCustomerEmail(email));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/validate-receiver")
  public ResponseEntity<ReceiverValidationResponseDTO> validateReceiverDetails(
      @RequestParam String bankName,
      @RequestParam String ifscCode,
      @RequestParam String holderName) {
    return ResponseEntity.ok(accountsService.validateReceiverDetails(bankName, ifscCode, holderName));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping("/lookup-by-number")
  public ResponseEntity<ReceiverValidationResponseDTO> lookupByAccountNumber(
      @RequestParam String accountNumber) {
    return ResponseEntity.ok(accountsService.lookupByAccountNumber(accountNumber));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping("/{accountNumber}/balance")
  public ResponseEntity<AccountLedgerBalanceDTO> getLedgerBalance(
      @PathVariable String accountNumber) {
    return ResponseEntity.ok(accountsService.getLedgerBalance(accountNumber));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  @PostMapping("/{bankName}")
  public ResponseEntity<AccountResponseDTO> createAccount(
      @PathVariable String bankName, @RequestBody AccountRequestDTO dto) {
    return ResponseEntity.ok(accountsService.createAccount(bankName, dto));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  @PatchMapping("/{accNumber}")
  public ResponseEntity<AccountResponseDTO> updateAccount(
      @PathVariable String accNumber, @RequestBody AccountRequestDTO dto) {
    return ResponseEntity.ok(accountsService.updateAccount(accNumber, dto));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER')")
  @PatchMapping("/{accNumber}/compliance")
  public ResponseEntity<AccountResponseDTO> updateAccountCompliance(
      @PathVariable String accNumber, @RequestBody AccountComplianceUpdateRequestDTO dto) {
    return ResponseEntity.ok(accountsService.updateAccountCompliance(accNumber, dto));
  }

  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @DeleteMapping("/{accNumber}")
  public ResponseEntity<AccountResponseDTO> deleteAccount(@PathVariable String accNumber) {
    accountsService.deleteAccount(accNumber);
    return ResponseEntity.ok().build();
  }
}

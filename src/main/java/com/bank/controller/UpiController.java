package com.bank.controller;

import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.dto.upi.UpiPayRequestDTO;
import com.bank.dto.upi.UpiProfileResponseDTO;
import com.bank.dto.upi.UpiRegisterRequestDTO;
import com.bank.security.JwtUtil;
import com.bank.service.upi.UpiService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/upi")
@RequiredArgsConstructor
public class UpiController {
  private final UpiService upiService;
  private final JwtUtil jwtUtil;

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
  @PostMapping("/register")
  public ResponseEntity<UpiProfileResponseDTO> registerUpiProfile(
      @Valid @RequestBody UpiRegisterRequestDTO dto) {
    UpiProfileResponseDTO response = upiService.registerUpiProfile(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping("/{upiId}")
  public ResponseEntity<UpiProfileResponseDTO> getUpiProfile(@PathVariable String upiId) {
    UpiProfileResponseDTO response = upiService.getUpiProfile(upiId);
    return ResponseEntity.ok(response);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping
  public ResponseEntity<List<UpiProfileResponseDTO>> getAllUpiProfiles() {
    List<UpiProfileResponseDTO> response = upiService.getAllUpiProfiles();
    return ResponseEntity.ok(response);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
  @GetMapping("/my")
  public ResponseEntity<List<UpiProfileResponseDTO>> getMyUpiProfiles(
      @RequestHeader("Authorization") String authHeader) {
    String token = authHeader.substring(7);
    Long userId = jwtUtil.extractUserId(token);
    List<UpiProfileResponseDTO> response = upiService.getUpiProfilesForUser(userId);
    return ResponseEntity.ok(response);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
  @GetMapping("/account/{accountNumber}")
  public ResponseEntity<List<UpiProfileResponseDTO>> getUpiProfilesByAccountNumber(
      @PathVariable String accountNumber) {
    List<UpiProfileResponseDTO> response = upiService.getUpiProfilesByAccountNumber(accountNumber);
    return ResponseEntity.ok(response);
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
  @PatchMapping("/{upiId}/status")
  public ResponseEntity<UpiProfileResponseDTO> updateUpiStatus(
      @PathVariable String upiId, @RequestParam String status) {
    UpiProfileResponseDTO response = upiService.updateUpiStatus(upiId, status);
    return ResponseEntity.ok(response);
  }

  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @DeleteMapping("/{upiId}")
  public ResponseEntity<Void> deleteUpiProfile(@PathVariable String upiId) {
    upiService.deleteUpiProfile(upiId);
    return ResponseEntity.noContent().build();
  }

  @PreAuthorize("hasRole('ROLE_USER')")
  @PostMapping("/pay")
  public ResponseEntity<TransactionResponseDTO> executeUpiPayment(
      @RequestBody UpiPayRequestDTO dto) {
    TransactionResponseDTO response = upiService.executeUpiPayment(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}

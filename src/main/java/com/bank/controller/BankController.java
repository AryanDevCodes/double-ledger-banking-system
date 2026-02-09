package com.bank.controller;

import com.bank.dto.bank.BankRequestDTO;
import com.bank.dto.bank.BankResponseDTO;
import com.bank.service.bank.BankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bank")
@RequiredArgsConstructor
public class BankController {
    private final BankService bankService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR')")
    public ResponseEntity<List<BankResponseDTO>> findAllBanks() {
        return ResponseEntity.ok(bankService.findAllBank());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR')")
    public ResponseEntity<BankResponseDTO> findBankById(@PathVariable String id) {
        return ResponseEntity.ok(bankService.findById(id));
    }

    @GetMapping("/upi/{upiId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
    public ResponseEntity<BankResponseDTO> findBankByUpiId(@PathVariable String upiId) {
        return ResponseEntity.ok(bankService.findByUpiId(upiId));
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<BankResponseDTO> createBank(@RequestBody BankRequestDTO bankRequestDTO) {
        return ResponseEntity.ok(bankService.createBank(bankRequestDTO));
    }
    
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<BankResponseDTO> updateBank(@PathVariable String id, @RequestBody BankRequestDTO bankRequestDTO) {
        return ResponseEntity.ok(bankService.updateBank(id, bankRequestDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteBank(@PathVariable String id) {
        bankService.deleteBank(id);
        return ResponseEntity.noContent().build();
    }
}

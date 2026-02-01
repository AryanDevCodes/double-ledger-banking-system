package com.bank.controller;

import com.bank.dto.bank.BankRequestDTO;
import com.bank.dto.bank.BankResponseDTO;
import com.bank.service.bank.BankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bank")
@RequiredArgsConstructor
public class BankController {
    private final BankService bankService;

    @GetMapping
    public ResponseEntity<List<BankResponseDTO>> findAllBanks() {
        return ResponseEntity.ok(bankService.findAllBank());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BankResponseDTO> findBankById(@PathVariable String id) {
        return ResponseEntity.ok(bankService.findById(id));
    }

    @PostMapping("/create")
    public ResponseEntity<BankResponseDTO> createBank(@RequestBody BankRequestDTO bankRequestDTO) {
        return ResponseEntity.ok(bankService.createBank(bankRequestDTO));
    }
    @PatchMapping("/{id}")
    public ResponseEntity<BankResponseDTO> updateBank(@PathVariable String id, @RequestBody BankRequestDTO bankRequestDTO) {
        return ResponseEntity.ok(bankService.updateBank(id, bankRequestDTO));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBank(@PathVariable String id) {
        bankService.deleteBank(id);
        return ResponseEntity.noContent().build();
    }
}

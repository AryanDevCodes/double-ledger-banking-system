package com.bank.controller;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.repository.LedgerRepository;
import com.bank.service.transaction.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final LedgerRepository ledgerRepository;

    @GetMapping
    public ResponseEntity<List<TransactionResponseDTO>> getTransactions( @RequestParam String accountNumber, String email ) {
            return ResponseEntity.ok(transactionService.getAllTransactions(accountNumber, email));
    }

    @PostMapping
    public ResponseEntity<TransactionResponseDTO> createTransaction( @RequestBody TransactionRequestDTO transactionRequestDTO ) {
        return ResponseEntity.ok(transactionService.makeTransaction(transactionRequestDTO));
    }

    @GetMapping("/accounts/{id}/balance")
    public BigDecimal getBalance( @PathVariable Long id) {
        return ledgerRepository.calculateBalance(id);
    }



}


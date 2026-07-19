package com.bank.controller;

import com.bank.dto.card.CardLimitUpdateRequest;
import com.bank.dto.card.DebitCardDTO;
import com.bank.dto.card.MerchantBlockUpdateRequest;
import com.bank.service.card.DebitCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/debit-cards")
@RequiredArgsConstructor
public class DebitCardController {
    private final DebitCardService debitCardService;

    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<List<DebitCardDTO>> getCardsByAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(debitCardService.getByAccountId(accountId));
    }

    @GetMapping("/account-number/{accountNumber}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<List<DebitCardDTO>> getCardsByAccountNumber(
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(debitCardService.getByAccountNumber(accountNumber));
    }

    @GetMapping("/{cardId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> getCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(debitCardService.getById(cardId));
    }

    @PutMapping("/{cardId}/toggle-contactless")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> toggleContactless(@PathVariable Long cardId, @RequestParam Boolean enabled) {
        return ResponseEntity.ok(debitCardService.toggleContactless(cardId, Boolean.TRUE.equals(enabled)));
    }

    @PutMapping("/{cardId}/toggle-international")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> toggleInternational(@PathVariable Long cardId, @RequestParam Boolean enabled) {
        return ResponseEntity.ok(debitCardService.toggleInternational(cardId, Boolean.TRUE.equals(enabled)));
    }

    @PutMapping("/{cardId}/toggle-otp")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> toggleOtp(@PathVariable Long cardId, @RequestParam Boolean enabled) {
        return ResponseEntity.ok(debitCardService.toggleOtp(cardId, Boolean.TRUE.equals(enabled)));
    }

    @PutMapping("/{cardId}/limits")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> updateLimits(
            @PathVariable Long cardId, @RequestBody CardLimitUpdateRequest request) {
        return ResponseEntity
                .ok(debitCardService.updateLimits(cardId, request.getDailyLimit(), request.getMonthlyLimit()));
    }

    @PutMapping("/{cardId}/merchant-blocks")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> updateMerchantBlocks(
            @PathVariable Long cardId, @RequestBody MerchantBlockUpdateRequest request) {
        return ResponseEntity.ok(debitCardService.updateMerchantBlocks(cardId, request.getCategories()));
    }

    @PostMapping("/{cardId}/freeze")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> freezeCard(@PathVariable Long cardId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(debitCardService.freezeCard(cardId, reason));
    }

    @PostMapping("/{cardId}/unfreeze")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> unfreezeCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(debitCardService.unfreezeCard(cardId));
    }

    @PostMapping("/{cardId}/replace")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> replaceCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(debitCardService.replaceCard(cardId));
    }

    @PutMapping("/{cardId}/block")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<DebitCardDTO> blockCard(@PathVariable Long cardId, @RequestParam String reason) {
        return ResponseEntity.ok(debitCardService.freezeCard(cardId, reason));
    }
}

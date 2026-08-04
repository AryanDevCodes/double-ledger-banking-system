package com.bank.controller;

import com.bank.dto.card.CardLimitUpdateRequest;
import com.bank.dto.card.CreditCardDTO;
import com.bank.dto.card.MerchantBlockUpdateRequest;
import com.bank.service.card.CreditCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/credit-cards")
@RequiredArgsConstructor
public class CreditCardController {
    private final CreditCardService creditCardService;

    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<List<CreditCardDTO>> getCardsByAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(creditCardService.getByAccountId(accountId));
    }

    @GetMapping("/account-number/{accountNumber}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<List<CreditCardDTO>> getCardsByAccountNumber(
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(creditCardService.getByAccountNumber(accountNumber));
    }

    @GetMapping("/{cardId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> getCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(creditCardService.getById(cardId));
    }

    @PutMapping("/{cardId}/toggle-contactless")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> toggleContactless(@PathVariable Long cardId, @RequestParam Boolean enabled) {
        return ResponseEntity.ok(creditCardService.toggleContactless(cardId, Boolean.TRUE.equals(enabled)));
    }

    @PutMapping("/{cardId}/toggle-international")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> toggleInternational(@PathVariable Long cardId, @RequestParam Boolean enabled) {
        return ResponseEntity.ok(creditCardService.toggleInternational(cardId, Boolean.TRUE.equals(enabled)));
    }

    @PutMapping("/{cardId}/toggle-otp")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> toggleOtp(@PathVariable Long cardId, @RequestParam Boolean enabled) {
        return ResponseEntity.ok(creditCardService.toggleOtp(cardId, Boolean.TRUE.equals(enabled)));
    }

    @PutMapping("/{cardId}/limits")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> updateLimits(
            @PathVariable Long cardId, @RequestBody CardLimitUpdateRequest request) {
        return ResponseEntity
                .ok(creditCardService.updateLimits(cardId, request.getDailyLimit(), request.getMonthlyLimit()));
    }

    @PutMapping("/{cardId}/merchant-blocks")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> updateMerchantBlocks(
            @PathVariable Long cardId, @RequestBody MerchantBlockUpdateRequest request) {
        return ResponseEntity.ok(creditCardService.updateMerchantBlocks(cardId, request.getCategories()));
    }

    @PostMapping("/{cardId}/freeze")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> freezeCard(@PathVariable Long cardId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(creditCardService.freezeCard(cardId, reason));
    }

    @PostMapping("/{cardId}/unfreeze")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> unfreezeCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(creditCardService.unfreezeCard(cardId));
    }

    @PostMapping("/{cardId}/replace")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> replaceCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(creditCardService.replaceCard(cardId));
    }

    @PutMapping("/{cardId}/block")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    public ResponseEntity<CreditCardDTO> blockCard(@PathVariable Long cardId, @RequestParam String reason) {
        return ResponseEntity.ok(creditCardService.freezeCard(cardId, reason));
    }
}

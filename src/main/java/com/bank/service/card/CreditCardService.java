package com.bank.service.card;

import com.bank.dto.card.CreditCardDTO;
import com.bank.dto.event.CardEventDTO;
import com.bank.entity.Account;
import com.bank.entity.CreditCard;
import com.bank.entity.Status;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.CreditCardRepository;
import com.bank.service.event.CardEventService;
import com.bank.service.mapper.CreditCardMapper;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreditCardService {
  private final CreditCardRepository creditCardRepository;
  private final AccountRepository accountRepository;
  private final CreditCardMapper creditCardMapper;
  private final CardAccessService cardAccessService;
  private final CardEventService cardEventService;
  private final SecureRandom random = new SecureRandom();

  @Transactional(readOnly = true)
  public List<CreditCardDTO> getByAccountId(Long accountId) {
    Account account = accountRepository.findById(accountId)
        .orElseThrow(() -> new ResourceNotFoundException("Account", "id", String.valueOf(accountId)));
    cardAccessService.assertAccountAccess(account);
    return creditCardRepository.findByAccountId(account.getId()).stream()
        .map(creditCardMapper::toDTO)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<CreditCardDTO> getByAccountNumber(String accountNumber) {
    Account account = accountRepository.findByAccountNumberWithDetails(accountNumber);
    if (account == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
    }
    cardAccessService.assertAccountAccess(account);
    return creditCardRepository.findByAccountId(account.getId()).stream()
        .map(creditCardMapper::toDTO)
        .toList();
  }

  @Transactional(readOnly = true)
  public CreditCardDTO getById(Long cardId) {
    CreditCard card = creditCardRepository.findById(cardId)
        .orElseThrow(() -> new ResourceNotFoundException("CreditCard", "id", String.valueOf(cardId)));
    cardAccessService.assertAccountAccess(card.getAccount());
    return creditCardMapper.toDTO(card);
  }

  @Transactional
  public CreditCardDTO toggleContactless(Long cardId, boolean enabled) {
    CreditCard card = loadAndAuthorize(cardId);
    card.setIsContactlessEnabled(enabled);
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.contactless", enabled ? "Contactless enabled" : "Contactless disabled");
    return creditCardMapper.toDTO(updated);
  }

  @Transactional
  public CreditCardDTO toggleInternational(Long cardId, boolean enabled) {
    CreditCard card = loadAndAuthorize(cardId);
    card.setIsInternationalEnabled(enabled);
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.international", enabled ? "International usage enabled" : "International usage disabled");
    return creditCardMapper.toDTO(updated);
  }

  @Transactional
  public CreditCardDTO toggleOtp(Long cardId, boolean enabled) {
    CreditCard card = loadAndAuthorize(cardId);
    card.setOtpRequired(enabled);
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.otp", enabled ? "OTP required" : "OTP disabled");
    return creditCardMapper.toDTO(updated);
  }

  @Transactional
  public CreditCardDTO updateLimits(Long cardId, BigDecimal dailyLimit, BigDecimal monthlyLimit) {
    CreditCard card = loadAndAuthorize(cardId);
    if (dailyLimit != null && dailyLimit.signum() < 0) {
      throw new InvalidDataException("Daily limit must be positive", "dailyLimit", dailyLimit);
    }
    if (monthlyLimit != null && monthlyLimit.signum() < 0) {
      throw new InvalidDataException("Monthly limit must be positive", "monthlyLimit", monthlyLimit);
    }
    if (dailyLimit != null && monthlyLimit != null && dailyLimit.compareTo(monthlyLimit) > 0) {
      throw new InvalidDataException("Daily limit cannot exceed monthly limit", "dailyLimit", dailyLimit);
    }
    if (card.getCreditLimit() != null) {
      BigDecimal limit = card.getCreditLimit();
      if (dailyLimit != null && dailyLimit.compareTo(limit) > 0) {
        throw new InvalidDataException("Daily limit exceeds credit limit", "dailyLimit", dailyLimit);
      }
      if (monthlyLimit != null && monthlyLimit.compareTo(limit) > 0) {
        throw new InvalidDataException("Monthly limit exceeds credit limit", "monthlyLimit", monthlyLimit);
      }
    }
    card.setDailyLimit(dailyLimit);
    card.setMonthlyLimit(monthlyLimit);
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.limits", "Credit card limits updated");
    return creditCardMapper.toDTO(updated);
  }

  @Transactional
  public CreditCardDTO updateMerchantBlocks(Long cardId, List<String> categories) {
    CreditCard card = loadAndAuthorize(cardId);
    String joined = categories == null || categories.isEmpty()
        ? null
        : String.join(",", categories);
    card.setMerchantCategoryBlocks(joined);
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.merchantBlocks", "Merchant category controls updated");
    return creditCardMapper.toDTO(updated);
  }

  @Transactional
  public CreditCardDTO freezeCard(Long cardId, String reason) {
    CreditCard card = loadAndAuthorize(cardId);
    card.setStatus(Status.BLOCKED);
    card.setBlockedReason(reason == null || reason.isBlank() ? "FROZEN" : reason.trim());
    card.setBlockedDate(LocalDateTime.now());
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.freeze", "Card frozen");
    return creditCardMapper.toDTO(updated);
  }

  @Transactional
  public CreditCardDTO unfreezeCard(Long cardId) {
    CreditCard card = loadAndAuthorize(cardId);
    card.setStatus(Status.ACTIVE);
    card.setBlockedReason(null);
    card.setBlockedDate(null);
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.unfreeze", "Card unfrozen");
    return creditCardMapper.toDTO(updated);
  }

  @Transactional
  public CreditCardDTO replaceCard(Long cardId) {
    CreditCard card = loadAndAuthorize(cardId);
    card.setCardNumber(generateCardNumber());
    card.setCvv(generateCvv());
    card.setExpiryDate(YearMonth.now().plusYears(4));
    card.setIssueDate(LocalDateTime.now());
    card.setStatus(Status.ACTIVE);
    card.setBlockedReason(null);
    card.setBlockedDate(null);
    CreditCard updated = creditCardRepository.save(card);
    publishEvent(updated, "card.replace", "Replacement card issued");
    return creditCardMapper.toDTO(updated);
  }

  private CreditCard loadAndAuthorize(Long cardId) {
    CreditCard card = creditCardRepository.findById(cardId)
        .orElseThrow(() -> new ResourceNotFoundException("CreditCard", "id", String.valueOf(cardId)));
    cardAccessService.assertAccountAccess(card.getAccount());
    return card;
  }

  private void publishEvent(CreditCard card, String type, String message) {
    Long userId = card.getAccount() != null && card.getAccount().getCustomer() != null
        && card.getAccount().getCustomer().getUser() != null
            ? card.getAccount().getCustomer().getUser().getId()
            : null;
    if (userId == null) {
      return;
    }
    CardEventDTO event = CardEventDTO.builder()
        .type(type)
        .message(message)
        .cardId(card.getId())
        .cardType("CREDIT")
        .severity("info")
        .occurredAt(LocalDateTime.now())
        .build();
    cardEventService.publish(userId, event);
  }

  private String generateCardNumber() {
    StringBuilder builder = new StringBuilder();
    for (int i = 0; i < 16; i++) {
      builder.append(random.nextInt(10));
    }
    return builder.toString();
  }

  private String generateCvv() {
    int cvv = 100 + random.nextInt(900);
    return String.valueOf(cvv);
  }
}

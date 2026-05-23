package com.bank.service.card;

import com.bank.dto.card.DebitCardDTO;
import com.bank.dto.event.CardEventDTO;
import com.bank.entity.Account;
import com.bank.entity.DebitCard;
import com.bank.entity.Status;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.DebitCardRepository;
import com.bank.service.event.CardEventService;
import com.bank.service.mapper.DebitCardMapper;
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
public class DebitCardService {
  private final DebitCardRepository debitCardRepository;
  private final AccountRepository accountRepository;
  private final DebitCardMapper debitCardMapper;
  private final CardAccessService cardAccessService;
  private final CardEventService cardEventService;
  private final SecureRandom random = new SecureRandom();

  @Transactional(readOnly = true)
  public List<DebitCardDTO> getByAccountId(Long accountId) {
    Account account = accountRepository.findById(accountId)
        .orElseThrow(() -> new ResourceNotFoundException("Account", "id", String.valueOf(accountId)));
    cardAccessService.assertAccountAccess(account);
    return debitCardRepository.findByAccountId(account.getId()).stream()
        .map(debitCardMapper::toDTO)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<DebitCardDTO> getByAccountNumber(String accountNumber) {
    Account account = accountRepository.findByAccountNumberWithDetails(accountNumber);
    if (account == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
    }
    cardAccessService.assertAccountAccess(account);
    return debitCardRepository.findByAccountId(account.getId()).stream()
        .map(debitCardMapper::toDTO)
        .toList();
  }

  @Transactional(readOnly = true)
  public DebitCardDTO getById(Long cardId) {
    DebitCard card = debitCardRepository.findById(cardId)
        .orElseThrow(() -> new ResourceNotFoundException("DebitCard", "id", String.valueOf(cardId)));
    cardAccessService.assertAccountAccess(card.getAccount());
    return debitCardMapper.toDTO(card);
  }

  @Transactional
  public DebitCardDTO toggleContactless(Long cardId, boolean enabled) {
    DebitCard card = loadAndAuthorize(cardId);
    card.setIsContactlessEnabled(enabled);
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.contactless", enabled ? "Contactless enabled" : "Contactless disabled");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCardDTO toggleInternational(Long cardId, boolean enabled) {
    DebitCard card = loadAndAuthorize(cardId);
    card.setIsInternationalEnabled(enabled);
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.international", enabled ? "International usage enabled" : "International usage disabled");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCardDTO toggleOtp(Long cardId, boolean enabled) {
    DebitCard card = loadAndAuthorize(cardId);
    card.setOtpRequired(enabled);
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.otp", enabled ? "OTP required" : "OTP disabled");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCardDTO updateLimits(Long cardId, BigDecimal dailyLimit, BigDecimal monthlyLimit) {
    DebitCard card = loadAndAuthorize(cardId);
    if (dailyLimit != null && dailyLimit.signum() < 0) {
      throw new InvalidDataException("Daily limit must be positive", "dailyLimit", dailyLimit);
    }
    if (monthlyLimit != null && monthlyLimit.signum() < 0) {
      throw new InvalidDataException("Monthly limit must be positive", "monthlyLimit", monthlyLimit);
    }
    if (dailyLimit != null && monthlyLimit != null && dailyLimit.compareTo(monthlyLimit) > 0) {
      throw new InvalidDataException("Daily limit cannot exceed monthly limit", "dailyLimit", dailyLimit);
    }
    card.setDailyLimit(dailyLimit);
    card.setMonthlyLimit(monthlyLimit);
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.limits", "Debit card limits updated");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCardDTO updateMerchantBlocks(Long cardId, List<String> categories) {
    DebitCard card = loadAndAuthorize(cardId);
    String joined = categories == null || categories.isEmpty()
        ? null
        : String.join(",", categories);
    card.setMerchantCategoryBlocks(joined);
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.merchantBlocks", "Merchant category controls updated");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCardDTO freezeCard(Long cardId, String reason) {
    DebitCard card = loadAndAuthorize(cardId);
    card.setStatus(Status.BLOCKED);
    card.setBlockedReason(reason == null || reason.isBlank() ? "FROZEN" : reason.trim());
    card.setBlockedDate(LocalDateTime.now());
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.freeze", "Card frozen");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCardDTO unfreezeCard(Long cardId) {
    DebitCard card = loadAndAuthorize(cardId);
    card.setStatus(Status.ACTIVE);
    card.setBlockedReason(null);
    card.setBlockedDate(null);
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.unfreeze", "Card unfrozen");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCardDTO replaceCard(Long cardId) {
    DebitCard card = loadAndAuthorize(cardId);
    card.setCardNumber(generateCardNumber());
    card.setCvv(generateCvv());
    card.setExpiryDate(YearMonth.now().plusYears(4));
    card.setIssueDate(LocalDateTime.now());
    card.setStatus(Status.ACTIVE);
    card.setBlockedReason(null);
    card.setBlockedDate(null);
    card.setSpentToday(BigDecimal.ZERO);
    card.setSpentMonth(BigDecimal.ZERO);
    DebitCard updated = debitCardRepository.save(card);
    publishEvent(updated, "card.replace", "Replacement card issued");
    return debitCardMapper.toDTO(updated);
  }

  @Transactional
  public DebitCard issueNewCard(
      Account account,
      String cardType,
      Boolean isVirtual,
      BigDecimal dailyLimit,
      BigDecimal monthlyLimit,
      Boolean otpRequired,
      Boolean isContactlessEnabled,
      Boolean isInternationalEnabled) {
    if (account == null) {
      throw new ResourceNotFoundException("Account", "id", "null");
    }
    String holderName = account.getCustomer() != null && account.getCustomer().getFullName() != null
      ? account.getCustomer().getFullName()
      : "Account Holder";
    DebitCard card = DebitCard.builder()
        .account(account)
        .cardNumber(generateCardNumber())
      .cardHolderName(holderName)
        .expiryDate(YearMonth.now().plusYears(4))
        .cvv(generateCvv())
        .cardType(cardType)
        .status(Status.ACTIVE)
        .isVirtual(Boolean.TRUE.equals(isVirtual))
        .isContactlessEnabled(isContactlessEnabled == null || Boolean.TRUE.equals(isContactlessEnabled))
        .isInternationalEnabled(Boolean.TRUE.equals(isInternationalEnabled))
        .otpRequired(otpRequired == null || Boolean.TRUE.equals(otpRequired))
        .dailyLimit(dailyLimit)
        .monthlyLimit(monthlyLimit)
        .issueDate(LocalDateTime.now())
        .build();
    DebitCard issued = debitCardRepository.save(card);
    publishEvent(issued, "card.issue", "New debit card issued");
    return issued;
  }

  private DebitCard loadAndAuthorize(Long cardId) {
    DebitCard card = debitCardRepository.findById(cardId)
        .orElseThrow(() -> new ResourceNotFoundException("DebitCard", "id", String.valueOf(cardId)));
    cardAccessService.assertAccountAccess(card.getAccount());
    return card;
  }

  private void publishEvent(DebitCard card, String type, String message) {
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
        .cardType("DEBIT")
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

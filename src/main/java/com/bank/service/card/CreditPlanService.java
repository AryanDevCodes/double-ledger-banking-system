package com.bank.service.card;

import com.bank.dto.event.CardEventDTO;
import com.bank.dto.plan.CreditPlanDTO;
import com.bank.entity.CreditCard;
import com.bank.entity.CreditPlan;
import com.bank.entity.Status;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.CreditCardRepository;
import com.bank.repository.CreditPlanRepository;
import com.bank.service.event.CardEventService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreditPlanService {
  private final CreditPlanRepository creditPlanRepository;
  private final CreditCardRepository creditCardRepository;
  private final CardAccessService cardAccessService;
  private final CardEventService cardEventService;

  @Transactional(readOnly = true)
  public List<CreditPlanDTO> listActive() {
    return creditPlanRepository.findByStatus(Status.ACTIVE).stream()
        .map(this::toDTO)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<CreditPlanDTO> listAll() {
    return creditPlanRepository.findAll().stream()
        .map(this::toDTO)
        .toList();
  }

  @Transactional
  public CreditPlanDTO createPlan(CreditPlanDTO dto) {
    validate(dto);
    CreditPlan plan = CreditPlan.builder()
        .name(dto.getName().trim())
        .description(dto.getDescription())
        .apr(dto.getApr())
        .annualFee(dto.getAnnualFee())
        .lateFee(dto.getLateFee())
        .gracePeriodDays(dto.getGracePeriodDays())
        .minLimit(dto.getMinLimit())
        .maxLimit(dto.getMaxLimit())
        .cashbackPercentage(dto.getCashbackPercentage())
        .status(Status.ACTIVE)
        .build();
    return toDTO(creditPlanRepository.save(plan));
  }

  @Transactional
  public CreditPlanDTO updatePlan(Long planId, CreditPlanDTO dto) {
    CreditPlan plan = creditPlanRepository.findById(planId)
        .orElseThrow(() -> new ResourceNotFoundException("CreditPlan", "id", String.valueOf(planId)));
    if (dto.getName() != null && !dto.getName().isBlank()) {
      plan.setName(dto.getName().trim());
    }
    if (dto.getDescription() != null) plan.setDescription(dto.getDescription());
    if (dto.getApr() != null) plan.setApr(dto.getApr());
    if (dto.getAnnualFee() != null) plan.setAnnualFee(dto.getAnnualFee());
    if (dto.getLateFee() != null) plan.setLateFee(dto.getLateFee());
    if (dto.getGracePeriodDays() != null) plan.setGracePeriodDays(dto.getGracePeriodDays());
    if (dto.getMinLimit() != null) plan.setMinLimit(dto.getMinLimit());
    if (dto.getMaxLimit() != null) plan.setMaxLimit(dto.getMaxLimit());
    if (dto.getCashbackPercentage() != null) plan.setCashbackPercentage(dto.getCashbackPercentage());
    if (dto.getStatus() != null) plan.setStatus(Status.valueOf(dto.getStatus()));
    return toDTO(creditPlanRepository.save(plan));
  }

  @Transactional
  public CreditPlanDTO assignPlanToCard(Long planId, Long cardId) {
    CreditPlan plan = creditPlanRepository.findById(planId)
        .orElseThrow(() -> new ResourceNotFoundException("CreditPlan", "id", String.valueOf(planId)));
    CreditCard card = creditCardRepository.findById(cardId)
        .orElseThrow(() -> new ResourceNotFoundException("CreditCard", "id", String.valueOf(cardId)));

    cardAccessService.assertAccountAccess(card.getAccount());

    card.setCreditPlan(plan);
    if (card.getCreditLimit() == null
        || card.getCreditLimit().compareTo(plan.getMinLimit()) < 0
        || card.getCreditLimit().compareTo(plan.getMaxLimit()) > 0) {
      card.setCreditLimit(plan.getMaxLimit());
    }
    BigDecimal currentBalance = card.getCurrentBalance() == null ? BigDecimal.ZERO : card.getCurrentBalance();
    card.setAvailableCredit(card.getCreditLimit().subtract(currentBalance).max(BigDecimal.ZERO));
    creditCardRepository.save(card);

    publishEvent(card, plan);
    return toDTO(plan);
  }

  private void publishEvent(CreditCard card, CreditPlan plan) {
    Long userId = card.getAccount() != null && card.getAccount().getCustomer() != null
        && card.getAccount().getCustomer().getUser() != null
            ? card.getAccount().getCustomer().getUser().getId()
            : null;
    if (userId == null) {
      return;
    }
    CardEventDTO event = CardEventDTO.builder()
        .type("credit.plan")
        .message("Credit plan updated to " + plan.getName())
        .cardId(card.getId())
        .cardType("CREDIT")
        .severity("info")
        .occurredAt(LocalDateTime.now())
        .build();
    cardEventService.publish(userId, event);
  }

  private void validate(CreditPlanDTO dto) {
    if (dto == null) {
      throw new InvalidDataException("Credit plan payload required");
    }
    if (dto.getName() == null || dto.getName().isBlank()) {
      throw new InvalidDataException("Plan name is required");
    }
    if (dto.getApr() == null || dto.getApr().signum() < 0) {
      throw new InvalidDataException("APR must be positive");
    }
    if (dto.getAnnualFee() == null || dto.getAnnualFee().signum() < 0) {
      throw new InvalidDataException("Annual fee must be positive");
    }
    if (dto.getLateFee() == null || dto.getLateFee().signum() < 0) {
      throw new InvalidDataException("Late fee must be positive");
    }
    if (dto.getGracePeriodDays() == null || dto.getGracePeriodDays() <= 0) {
      throw new InvalidDataException("Grace period must be positive");
    }
    if (dto.getMinLimit() == null || dto.getMinLimit().signum() < 0) {
      throw new InvalidDataException("Minimum limit must be positive");
    }
    if (dto.getMaxLimit() == null || dto.getMaxLimit().signum() <= 0) {
      throw new InvalidDataException("Maximum limit must be positive");
    }
    if (dto.getCashbackPercentage() == null || dto.getCashbackPercentage().signum() < 0) {
      throw new InvalidDataException("Cashback must be positive");
    }
  }

  private CreditPlanDTO toDTO(CreditPlan plan) {
    return CreditPlanDTO.builder()
        .id(plan.getId())
        .name(plan.getName())
        .description(plan.getDescription())
        .apr(plan.getApr())
        .annualFee(plan.getAnnualFee())
        .lateFee(plan.getLateFee())
        .gracePeriodDays(plan.getGracePeriodDays())
        .minLimit(plan.getMinLimit())
        .maxLimit(plan.getMaxLimit())
        .cashbackPercentage(plan.getCashbackPercentage())
        .status(plan.getStatus() != null ? plan.getStatus().name() : null)
        .build();
  }
}

package com.bank.service.card;

import com.bank.dto.card.DebitCardRequestCreateRequest;
import com.bank.dto.card.DebitCardRequestDTO;
import com.bank.dto.card.DebitCardRequestDecisionRequest;
import com.bank.entity.*;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.DebitCardRequestRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DebitCardRequestService {
  private final DebitCardRequestRepository debitCardRequestRepository;
  private final AccountRepository accountRepository;
  private final DebitCardService debitCardService;
  private final CardAccessService cardAccessService;

  @Transactional
  public DebitCardRequestDTO createRequest(DebitCardRequestCreateRequest request) {
    if (request == null || request.getAccountNumber() == null || request.getAccountNumber().isBlank()) {
      throw new InvalidDataException("Account number is required", "accountNumber", null);
    }
    Account account = accountRepository.findByAccountNumberWithDetails(request.getAccountNumber());
    if (account == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", request.getAccountNumber());
    }
    cardAccessService.assertAccountAccess(account);
    User currentUser = cardAccessService.requireCurrentUser();
    if (account.getCustomer() == null || account.getCustomer().getKycStatus() == null) {
      throw new InvalidDataException("KYC verification required before requesting a card", "kycStatus", null);
    }
    boolean isKycApproved = account.getCustomer().getKycStatus() == Status.COMPLETED
        || account.getCustomer().getKycStatus() == Status.SUCCESS;
    if (!isKycApproved) {
      throw new InvalidDataException("KYC verification required before requesting a card", "kycStatus", account.getCustomer().getKycStatus());
    }

    boolean isVirtual = Boolean.TRUE.equals(request.getIsVirtual());
    String deliveryMethod = resolveValue(request.getDeliveryMethod(), "STANDARD");
    String deliveryAddress = request.getDeliveryAddress();
    DeliveryStatus deliveryStatus = isVirtual ? DeliveryStatus.NOT_REQUIRED : DeliveryStatus.PENDING;
    LocalDateTime expectedDeliveryDate = isVirtual ? null : LocalDate.now().plusDays(5).atStartOfDay();
    if (!isVirtual && (deliveryAddress == null || deliveryAddress.isBlank())) {
      throw new InvalidDataException("Delivery address required for physical card", "deliveryAddress", null);
    }

    DebitCardRequest entity = DebitCardRequest.builder()
        .account(account)
        .requestedBy(currentUser)
        .status(CardRequestStatus.PENDING)
        .cardType(request.getCardType())
        .isVirtual(isVirtual)
        .dailyLimit(request.getDailyLimit())
        .monthlyLimit(request.getMonthlyLimit())
        .otpRequired(request.getOtpRequired() == null || Boolean.TRUE.equals(request.getOtpRequired()))
        .isContactlessEnabled(request.getIsContactlessEnabled() == null || Boolean.TRUE.equals(request.getIsContactlessEnabled()))
        .isInternationalEnabled(Boolean.TRUE.equals(request.getIsInternationalEnabled()))
        .deliveryMethod(deliveryMethod)
        .deliveryAddress(deliveryAddress)
        .deliveryStatus(deliveryStatus)
        .expectedDeliveryDate(expectedDeliveryDate)
        .kycStatusAtRequest(account.getCustomer().getKycStatus().name())
        .build();

    return toDto(debitCardRequestRepository.save(entity));
  }

  @Transactional(readOnly = true)
  public List<DebitCardRequestDTO> getMyRequests() {
    User currentUser = cardAccessService.requireCurrentUser();
    return debitCardRequestRepository.findByRequestedByIdOrderByRequestedAtDesc(currentUser.getId())
        .stream()
        .map(this::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<DebitCardRequestDTO> getPendingRequests() {
    List<DebitCardRequest> pending = debitCardRequestRepository
        .findByStatusOrderByRequestedAtAsc(CardRequestStatus.PENDING);
    User currentUser = cardAccessService.requireCurrentUser();
    boolean isAdmin = cardAccessService.hasRole(currentUser, Role.RoleName.ROLE_ADMIN);
    if (!isAdmin) {
      pending = pending.stream()
          .filter(request -> request.getAccount() != null)
          .filter(request -> {
            try {
              cardAccessService.assertAccountAccess(request.getAccount());
              return true;
            } catch (Exception ex) {
              return false;
            }
          })
          .toList();
    }
    return pending.stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public List<DebitCardRequestDTO> getApprovedRequests() {
    List<DebitCardRequest> approved = debitCardRequestRepository
        .findByStatusOrderByRequestedAtAsc(CardRequestStatus.APPROVED);
    User currentUser = cardAccessService.requireCurrentUser();
    boolean isAdmin = cardAccessService.hasRole(currentUser, Role.RoleName.ROLE_ADMIN);
    if (!isAdmin) {
      approved = approved.stream()
          .filter(request -> request.getAccount() != null)
          .filter(request -> {
            try {
              cardAccessService.assertAccountAccess(request.getAccount());
              return true;
            } catch (Exception ex) {
              return false;
            }
          })
          .toList();
    }
    return approved.stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public List<DebitCardRequestDTO> getIssuedRequests() {
    List<DebitCardRequest> issued = debitCardRequestRepository
        .findByStatusOrderByRequestedAtAsc(CardRequestStatus.ISSUED);
    User currentUser = cardAccessService.requireCurrentUser();
    boolean isAdmin = cardAccessService.hasRole(currentUser, Role.RoleName.ROLE_ADMIN);
    if (!isAdmin) {
      issued = issued.stream()
          .filter(request -> request.getAccount() != null)
          .filter(request -> {
            try {
              cardAccessService.assertAccountAccess(request.getAccount());
              return true;
            } catch (Exception ex) {
              return false;
            }
          })
          .toList();
    }
    return issued.stream().map(this::toDto).toList();
  }

  @Transactional
  public DebitCardRequestDTO approveRequest(Long requestId, DebitCardRequestDecisionRequest decisionRequest) {
    DebitCardRequest request = loadRequest(requestId);
    cardAccessService.assertAccountAccess(request.getAccount());
    if (request.getStatus() != CardRequestStatus.PENDING) {
      throw new InvalidDataException("Only pending requests can be approved", "status", request.getStatus());
    }

    User approver = cardAccessService.requireCurrentUser();
    if (!cardAccessService.hasRole(approver, Role.RoleName.ROLE_ADMIN)
        && !cardAccessService.hasRole(approver, Role.RoleName.ROLE_MANAGER)) {
      throw new AccessDeniedException("Only administrators or managers can approve requests");
    }

    request.setStatus(CardRequestStatus.APPROVED);
    request.setApprovedBy(approver);
    request.setApprovedAt(LocalDateTime.now());
    request.setRejectionReason(null);
    request.setReviewNotes(resolveValue(decisionRequest.getReviewNotes(), request.getReviewNotes()));
    request.setCardType(resolveValue(decisionRequest.getCardType(), request.getCardType()));
    request.setIsVirtual(resolveValue(decisionRequest.getIsVirtual(), request.getIsVirtual()));
    request.setDailyLimit(resolveValue(decisionRequest.getDailyLimit(), request.getDailyLimit()));
    request.setMonthlyLimit(resolveValue(decisionRequest.getMonthlyLimit(), request.getMonthlyLimit()));
    request.setOtpRequired(resolveValue(decisionRequest.getOtpRequired(), request.getOtpRequired()));
    request.setIsContactlessEnabled(resolveValue(decisionRequest.getIsContactlessEnabled(), request.getIsContactlessEnabled()));
    request.setIsInternationalEnabled(resolveValue(decisionRequest.getIsInternationalEnabled(), request.getIsInternationalEnabled()));
    request.setDeliveryMethod(resolveValue(decisionRequest.getDeliveryMethod(), request.getDeliveryMethod()));
    request.setDeliveryAddress(resolveValue(decisionRequest.getDeliveryAddress(), request.getDeliveryAddress()));
    String expectedDeliveryDate = decisionRequest.getExpectedDeliveryDate();
    if (expectedDeliveryDate != null && !expectedDeliveryDate.isBlank()) {
      request.setExpectedDeliveryDate(LocalDateTime.parse(expectedDeliveryDate));
    }
    if (Boolean.TRUE.equals(request.getIsVirtual())) {
      request.setDeliveryStatus(DeliveryStatus.NOT_REQUIRED);
    } else if (request.getDeliveryStatus() == DeliveryStatus.NOT_REQUIRED) {
      request.setDeliveryStatus(DeliveryStatus.PENDING);
    }

    return toDto(debitCardRequestRepository.save(request));
  }

  @Transactional
  public DebitCardRequestDTO issueRequest(Long requestId) {
    DebitCardRequest request = loadRequest(requestId);
    cardAccessService.assertAccountAccess(request.getAccount());
    if (request.getStatus() != CardRequestStatus.APPROVED) {
      throw new InvalidDataException("Only approved requests can be issued", "status", request.getStatus());
    }
    User issuer = cardAccessService.requireCurrentUser();
    if (!cardAccessService.hasRole(issuer, Role.RoleName.ROLE_ADMIN)
        && !cardAccessService.hasRole(issuer, Role.RoleName.ROLE_MANAGER)) {
      throw new AccessDeniedException("Only administrators or managers can issue cards");
    }

    DebitCard issued = debitCardService.issueNewCard(
        request.getAccount(),
        request.getCardType(),
        request.getIsVirtual(),
        request.getDailyLimit(),
        request.getMonthlyLimit(),
        request.getOtpRequired(),
        request.getIsContactlessEnabled(),
        request.getIsInternationalEnabled());

    request.setStatus(CardRequestStatus.ISSUED);
    request.setIssuedCard(issued);
    request.setIssuedAt(LocalDateTime.now());
    if (Boolean.TRUE.equals(request.getIsVirtual())) {
      request.setDeliveryStatus(DeliveryStatus.NOT_REQUIRED);
    } else if (request.getDeliveryStatus() == null) {
      request.setDeliveryStatus(DeliveryStatus.PENDING);
    }
    return toDto(debitCardRequestRepository.save(request));
  }

  @Transactional
  public DebitCardRequestDTO dispatchRequest(Long requestId, DebitCardRequestDecisionRequest decisionRequest) {
    DebitCardRequest request = loadRequest(requestId);
    cardAccessService.assertAccountAccess(request.getAccount());
    if (request.getStatus() != CardRequestStatus.ISSUED) {
      throw new InvalidDataException("Only issued requests can be dispatched", "status", request.getStatus());
    }
    User dispatcher = cardAccessService.requireCurrentUser();
    if (!cardAccessService.hasRole(dispatcher, Role.RoleName.ROLE_ADMIN)
        && !cardAccessService.hasRole(dispatcher, Role.RoleName.ROLE_MANAGER)) {
      throw new AccessDeniedException("Only administrators or managers can dispatch cards");
    }
    if (Boolean.TRUE.equals(request.getIsVirtual())) {
      request.setDeliveryStatus(DeliveryStatus.NOT_REQUIRED);
      return toDto(debitCardRequestRepository.save(request));
    }
    String trackingNumber = decisionRequest != null ? decisionRequest.getTrackingNumber() : null;
    if (trackingNumber == null || trackingNumber.isBlank()) {
      throw new InvalidDataException("Tracking number required for dispatch", "trackingNumber", null);
    }
    request.setTrackingNumber(trackingNumber.trim());
    request.setDeliveryStatus(DeliveryStatus.DISPATCHED);
    request.setDispatchedAt(LocalDateTime.now());
    String expectedDeliveryDate = decisionRequest != null ? decisionRequest.getExpectedDeliveryDate() : null;
    if (expectedDeliveryDate != null && !expectedDeliveryDate.isBlank()) {
      request.setExpectedDeliveryDate(LocalDateTime.parse(expectedDeliveryDate));
    }
    return toDto(debitCardRequestRepository.save(request));
  }

  @Transactional
  public DebitCardRequestDTO deliverRequest(Long requestId) {
    DebitCardRequest request = loadRequest(requestId);
    cardAccessService.assertAccountAccess(request.getAccount());
    if (request.getStatus() != CardRequestStatus.ISSUED) {
      throw new InvalidDataException("Only issued requests can be delivered", "status", request.getStatus());
    }
    if (request.getDeliveryStatus() != DeliveryStatus.DISPATCHED) {
      throw new InvalidDataException("Only dispatched requests can be delivered", "deliveryStatus", request.getDeliveryStatus());
    }
    User dispatcher = cardAccessService.requireCurrentUser();
    if (!cardAccessService.hasRole(dispatcher, Role.RoleName.ROLE_ADMIN)
        && !cardAccessService.hasRole(dispatcher, Role.RoleName.ROLE_MANAGER)) {
      throw new AccessDeniedException("Only administrators or managers can confirm delivery");
    }
    request.setDeliveryStatus(DeliveryStatus.DELIVERED);
    request.setDeliveredAt(LocalDateTime.now());
    return toDto(debitCardRequestRepository.save(request));
  }

  @Transactional
  public DebitCardRequestDTO rejectRequest(Long requestId, DebitCardRequestDecisionRequest decisionRequest) {
    DebitCardRequest request = loadRequest(requestId);
    cardAccessService.assertAccountAccess(request.getAccount());
    if (request.getStatus() != CardRequestStatus.PENDING) {
      throw new InvalidDataException("Only pending requests can be rejected", "status", request.getStatus());
    }

    User approver = cardAccessService.requireCurrentUser();
    if (!cardAccessService.hasRole(approver, Role.RoleName.ROLE_ADMIN)
        && !cardAccessService.hasRole(approver, Role.RoleName.ROLE_MANAGER)) {
      throw new AccessDeniedException("Only administrators or managers can reject requests");
    }

    String reason = decisionRequest != null ? decisionRequest.getRejectionReason() : null;
    request.setStatus(CardRequestStatus.REJECTED);
    request.setApprovedBy(approver);
    request.setApprovedAt(LocalDateTime.now());
    request.setRejectionReason(reason == null || reason.isBlank() ? "Rejected" : reason.trim());

    return toDto(debitCardRequestRepository.save(request));
  }

  private DebitCardRequest loadRequest(Long requestId) {
    return debitCardRequestRepository.findById(requestId)
        .orElseThrow(() -> new ResourceNotFoundException("DebitCardRequest", "id", String.valueOf(requestId)));
  }

  private DebitCardRequestDTO toDto(DebitCardRequest request) {
    String requestedByName = request.getRequestedBy() != null
        ? (request.getRequestedBy().getFullName() != null ? request.getRequestedBy().getFullName() : request.getRequestedBy().getUsername())
        : null;
    return DebitCardRequestDTO.builder()
        .id(request.getId())
        .accountId(request.getAccount() != null ? request.getAccount().getId() : null)
        .accountNumber(request.getAccount() != null ? request.getAccount().getAccountNumber() : null)
        .requestedByUserId(request.getRequestedBy() != null ? request.getRequestedBy().getId() : null)
        .requestedByName(requestedByName)
        .status(request.getStatus() != null ? request.getStatus().name() : null)
        .requestedAt(request.getRequestedAt() != null ? request.getRequestedAt().toString() : null)
        .approvedAt(request.getApprovedAt() != null ? request.getApprovedAt().toString() : null)
        .issuedCardId(request.getIssuedCard() != null ? request.getIssuedCard().getId() : null)
        .cardType(request.getCardType())
        .isVirtual(request.getIsVirtual())
        .dailyLimit(request.getDailyLimit())
        .monthlyLimit(request.getMonthlyLimit())
        .otpRequired(request.getOtpRequired())
        .isContactlessEnabled(request.getIsContactlessEnabled())
        .isInternationalEnabled(request.getIsInternationalEnabled())
          .deliveryMethod(request.getDeliveryMethod())
          .deliveryAddress(request.getDeliveryAddress())
          .deliveryStatus(request.getDeliveryStatus() != null ? request.getDeliveryStatus().name() : null)
          .trackingNumber(request.getTrackingNumber())
          .expectedDeliveryDate(request.getExpectedDeliveryDate() != null ? request.getExpectedDeliveryDate().toString() : null)
          .issuedAt(request.getIssuedAt() != null ? request.getIssuedAt().toString() : null)
          .dispatchedAt(request.getDispatchedAt() != null ? request.getDispatchedAt().toString() : null)
          .deliveredAt(request.getDeliveredAt() != null ? request.getDeliveredAt().toString() : null)
          .kycStatusAtRequest(request.getKycStatusAtRequest())
          .reviewNotes(request.getReviewNotes())
        .rejectionReason(request.getRejectionReason())
        .build();
  }

  private String resolveValue(String value, String fallback) {
    return value != null && !value.isBlank() ? value : fallback;
  }

  private Boolean resolveValue(Boolean value, Boolean fallback) {
    return value != null ? value : fallback;
  }

  private <T> T resolveValue(T value, T fallback) {
    return value != null ? value : fallback;
  }
}

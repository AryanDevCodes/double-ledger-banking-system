package com.bank.controller;

import com.bank.dto.card.DebitCardRequestCreateRequest;
import com.bank.dto.card.DebitCardRequestDTO;
import com.bank.dto.card.DebitCardRequestDecisionRequest;
import com.bank.service.card.DebitCardRequestService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/debit-card-requests")
@RequiredArgsConstructor
public class DebitCardRequestController {
  private final DebitCardRequestService debitCardRequestService;

  @PostMapping
  @PreAuthorize("hasAnyRole('ROLE_USER')")
  public ResponseEntity<DebitCardRequestDTO> createRequest(@RequestBody DebitCardRequestCreateRequest request) {
    return ResponseEntity.ok(debitCardRequestService.createRequest(request));
  }

  @GetMapping("/my")
  @PreAuthorize("hasAnyRole('ROLE_USER')")
  public ResponseEntity<List<DebitCardRequestDTO>> getMyRequests() {
    return ResponseEntity.ok(debitCardRequestService.getMyRequests());
  }

  @GetMapping("/pending")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<List<DebitCardRequestDTO>> getPendingRequests() {
    return ResponseEntity.ok(debitCardRequestService.getPendingRequests());
  }

  @GetMapping("/approved")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<List<DebitCardRequestDTO>> getApprovedRequests() {
    return ResponseEntity.ok(debitCardRequestService.getApprovedRequests());
  }

  @GetMapping("/issued")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<List<DebitCardRequestDTO>> getIssuedRequests() {
    return ResponseEntity.ok(debitCardRequestService.getIssuedRequests());
  }

  @PostMapping("/{requestId}/approve")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<DebitCardRequestDTO> approveRequest(
      @PathVariable Long requestId,
      @RequestBody(required = false) DebitCardRequestDecisionRequest request) {
    DebitCardRequestDecisionRequest decision = request == null ? new DebitCardRequestDecisionRequest() : request;
    return ResponseEntity.ok(debitCardRequestService.approveRequest(requestId, decision));
  }

  @PostMapping("/{requestId}/reject")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<DebitCardRequestDTO> rejectRequest(
      @PathVariable Long requestId,
      @RequestBody(required = false) DebitCardRequestDecisionRequest request) {
    DebitCardRequestDecisionRequest decision = request == null ? new DebitCardRequestDecisionRequest() : request;
    return ResponseEntity.ok(debitCardRequestService.rejectRequest(requestId, decision));
  }

  @PostMapping("/{requestId}/issue")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<DebitCardRequestDTO> issueRequest(@PathVariable Long requestId) {
    return ResponseEntity.ok(debitCardRequestService.issueRequest(requestId));
  }

  @PostMapping("/{requestId}/dispatch")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<DebitCardRequestDTO> dispatchRequest(
      @PathVariable Long requestId,
      @RequestBody(required = false) DebitCardRequestDecisionRequest request) {
    DebitCardRequestDecisionRequest decision = request == null ? new DebitCardRequestDecisionRequest() : request;
    return ResponseEntity.ok(debitCardRequestService.dispatchRequest(requestId, decision));
  }

  @PostMapping("/{requestId}/deliver")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<DebitCardRequestDTO> deliverRequest(@PathVariable Long requestId) {
    return ResponseEntity.ok(debitCardRequestService.deliverRequest(requestId));
  }
}

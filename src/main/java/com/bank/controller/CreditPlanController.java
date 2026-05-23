package com.bank.controller;

import com.bank.dto.plan.CreditPlanDTO;
import com.bank.service.card.CreditPlanService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/credit-plans")
@RequiredArgsConstructor
public class CreditPlanController {
  private final CreditPlanService creditPlanService;

  @GetMapping
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
  public ResponseEntity<List<CreditPlanDTO>> listActivePlans() {
    return ResponseEntity.ok(creditPlanService.listActive());
  }

  @GetMapping("/all")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<List<CreditPlanDTO>> listAllPlans() {
    return ResponseEntity.ok(creditPlanService.listAll());
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<CreditPlanDTO> createPlan(@RequestBody CreditPlanDTO dto) {
    return ResponseEntity.ok(creditPlanService.createPlan(dto));
  }

  @PatchMapping("/{planId}")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  public ResponseEntity<CreditPlanDTO> updatePlan(
      @PathVariable Long planId, @RequestBody CreditPlanDTO dto) {
    return ResponseEntity.ok(creditPlanService.updatePlan(planId, dto));
  }

  @PostMapping("/{planId}/assign/{cardId}")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
  public ResponseEntity<CreditPlanDTO> assignPlan(
      @PathVariable Long planId, @PathVariable Long cardId) {
    return ResponseEntity.ok(creditPlanService.assignPlanToCard(planId, cardId));
  }
}

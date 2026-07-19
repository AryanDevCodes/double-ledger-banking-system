package com.bank.controller;

import com.bank.entity.WebhookSubscription;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.WebhookSubscriptionRepository;
import java.util.List;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin/manager APIs for managing outbound webhook subscriptions. Receivers
 * verify the
 * {@code X-Bank-Signature} header (HMAC-SHA256 hex of the raw body) using the
 * secret returned at
 * registration time.
 */
@RestController
@RequestMapping("/webhooks")
@RequiredArgsConstructor
public class WebhookController {

  private final WebhookSubscriptionRepository repository;

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  @PostMapping
  public ResponseEntity<WebhookSubscription> create(@RequestBody WebhookCreateRequest request) {
    if (request == null
        || request.getTargetUrl() == null
        || request.getTargetUrl().isBlank()
        || request.getEventTypes() == null
        || request.getEventTypes().isBlank()
        || request.getSecret() == null
        || request.getSecret().isBlank()) {
      throw new InvalidDataException("targetUrl, eventTypes and secret are required");
    }
    WebhookSubscription sub = WebhookSubscription.builder()
        .targetUrl(request.getTargetUrl())
        .eventTypes(request.getEventTypes())
        .secret(request.getSecret())
        .description(request.getDescription())
        .active(true)
        .build();
    return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(sub));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR')")
  @GetMapping
  public ResponseEntity<List<WebhookSubscription>> list() {
    return ResponseEntity.ok(repository.findAll());
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    WebhookSubscription sub = repository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Webhook", "id", id.toString()));
    repository.delete(sub);
    return ResponseEntity.noContent().build();
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  @PatchMapping("/{id}/active")
  public ResponseEntity<WebhookSubscription> setActive(
      @PathVariable Long id, @RequestParam boolean active) {
    WebhookSubscription sub = repository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Webhook", "id", id.toString()));
    sub.setActive(active);
    return ResponseEntity.ok(repository.save(sub));
  }

  @Data
  public static class WebhookCreateRequest {
    private String targetUrl;
    private String eventTypes;
    private String secret;
    private String description;
  }
}

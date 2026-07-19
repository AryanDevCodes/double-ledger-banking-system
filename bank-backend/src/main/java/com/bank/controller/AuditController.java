package com.bank.controller;

import com.bank.dto.audit.AuditLogEntryDTO;
import com.bank.dto.audit.AuditLogPageResponseDTO;
import com.bank.exception.InvalidDataException;
import com.bank.service.audit.AuditService;

import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
public
class AuditController {
  private final AuditService auditService;

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_AUDITOR')")
  @GetMapping("/logs")
  public ResponseEntity<AuditLogPageResponseDTO> getLogs(
      @RequestParam(required = false) String startDate,
      @RequestParam(required = false) String endDate,
      @RequestParam(required = false) String action,
      @RequestParam(required = false) String userId,
      @RequestParam(required = false) String resource,
      @RequestParam(defaultValue = "1") Integer page,
      @RequestParam(defaultValue = "25") Integer size) {
    LocalDateTime parsedStart = parseDateParam(startDate, false, "startDate");
    LocalDateTime parsedEnd = parseDateParam(endDate, true, "endDate");
    return ResponseEntity.ok(
        auditService.getLogs(parsedStart, parsedEnd, action, userId, resource, page, size));
  }

  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_AUDITOR')")
  @GetMapping("/logs/{id}")
  public ResponseEntity<AuditLogEntryDTO> getLogById(@PathVariable String id) {
    return ResponseEntity.ok(auditService.getLogById(id));
  }

  private LocalDateTime parseDateParam(String value, boolean endOfDay, String fieldName) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    try {
      return LocalDateTime.parse(value.trim());
    } catch (DateTimeParseException ex) {
      try {
        LocalDate date = LocalDate.parse(value.trim());
        return endOfDay ? date.atTime(LocalTime.MAX) : date.atStartOfDay();
      } catch (DateTimeParseException nestedEx) {
        throw new InvalidDataException(
            "Invalid " + fieldName + " format. Use ISO date-time or yyyy-MM-dd", fieldName, value);
      }
    }
  }
}

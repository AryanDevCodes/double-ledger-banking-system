package com.bank.controller;

import com.bank.dto.security.AccessLogEntryDTO;
import com.bank.dto.security.SessionInfoDTO;
import com.bank.dto.security.TerminateAllSessionsRequestDTO;
import com.bank.service.security.SecurityService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/security")
@RequiredArgsConstructor
public class SecurityController {

  private final SecurityService securityService;

  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @GetMapping("/sessions")
  public ResponseEntity<List<SessionInfoDTO>> getSessions() {
    return ResponseEntity.ok(securityService.getSessions());
  }

  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @DeleteMapping("/sessions/{sessionId}")
  public ResponseEntity<Void> terminateSession(@PathVariable String sessionId) {
    securityService.terminateSession(sessionId);
    return ResponseEntity.noContent().build();
  }

  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @PostMapping("/sessions/terminate-all")
  public ResponseEntity<Void> terminateAllSessions(
      @RequestBody(required = false) TerminateAllSessionsRequestDTO request,
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    boolean excludeCurrent = request != null && Boolean.TRUE.equals(request.getExcludeCurrent());
    securityService.terminateAllSessions(excludeCurrent, extractBearerToken(authHeader));
    return ResponseEntity.noContent().build();
  }

  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @GetMapping("/access-logs")
  public ResponseEntity<List<AccessLogEntryDTO>> getAccessLogs(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
      @RequestParam(required = false) String eventType) {
    return ResponseEntity.ok(securityService.getAccessLogs(startDate, endDate, eventType));
  }

  private String extractBearerToken(String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }
}

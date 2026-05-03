package com.bank.service.audit;

import com.bank.dto.audit.AuditLogEntryDTO;
import com.bank.dto.audit.AuditLogPageResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

public interface AuditService {
  AuditLogPageResponseDTO getLogs(
      LocalDateTime startDate,
      LocalDateTime endDate,
      String action,
      String userId,
      String resource,
      Integer page,
      Integer size);

  AuditLogEntryDTO getLogById(String id);

  void logEvent(
      Long userId,
      String userName,
      String action,
      String resource,
      String resourceId,
      String details,
      String status,
      HttpServletRequest request);
}

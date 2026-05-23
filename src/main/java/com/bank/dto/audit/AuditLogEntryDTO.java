package com.bank.dto.audit;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class AuditLogEntryDTO {
  private String id;
  private LocalDateTime timestamp;
  private String userId;
  private String userName;
  private String action;
  private String resource;
  private String resourceId;
  private String details;
  private String ipAddress;
  private String userAgent;
  private String status;
}

package com.bank.dto.security;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessLogEntryDTO {
  private String id;
  private LocalDateTime timestamp;
  private String userId;
  private String userName;
  private String eventType;
  private String ipAddress;
  private String userAgent;
  private String location;
  private boolean success;
}

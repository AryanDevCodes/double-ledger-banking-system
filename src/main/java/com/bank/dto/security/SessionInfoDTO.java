package com.bank.dto.security;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfoDTO {
  private String id;
  private String userId;
  private String userName;
  private String ipAddress;
  private String userAgent;
  private LocalDateTime createdAt;
  private LocalDateTime lastActivity;
  private LocalDateTime expiresAt;

  @JsonProperty("isActive")
  private boolean active;
}

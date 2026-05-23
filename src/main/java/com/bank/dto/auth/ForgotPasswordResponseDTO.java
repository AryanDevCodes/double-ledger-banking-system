package com.bank.dto.auth;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public
class ForgotPasswordResponseDTO {
  private String message;
  private String resetToken;
  private LocalDateTime expiresAt;
}

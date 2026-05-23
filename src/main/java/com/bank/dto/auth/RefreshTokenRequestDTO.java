package com.bank.dto.auth;

import lombok.Data;

@Data
public class RefreshTokenRequestDTO {
  private String refreshToken;
}

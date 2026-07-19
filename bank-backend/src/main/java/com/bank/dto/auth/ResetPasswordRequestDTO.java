package com.bank.dto.auth;

import lombok.Data;

@Data
public
class ResetPasswordRequestDTO {
  private String token;
  private String newPassword;
}

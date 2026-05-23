package com.bank.dto.auth;

import lombok.Data;

@Data
public class ChangePasswordRequestDTO {
  private String currentPassword;
  private String newPassword;
}

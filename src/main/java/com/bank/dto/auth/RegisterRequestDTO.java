package com.bank.dto.auth;

import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public
class RegisterRequestDTO {
  private String username;
  private String email;
  private String password;
  private String fullName;
  private String phoneNumber;
  private Set<String> roles;
}

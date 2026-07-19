package com.bank.dto.upi;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public
class UpiRegisterRequestDTO {
  @NotBlank(message = "UPI ID cannot be blank")
  private String upiId;

  @NotBlank(message = "Account number cannot be blank")
  private String accountNumber;
}

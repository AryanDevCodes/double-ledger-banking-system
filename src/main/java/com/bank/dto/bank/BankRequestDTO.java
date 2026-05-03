package com.bank.dto.bank;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public
class BankRequestDTO {
  @NotNull(message = "Bank name cannot be null")
  private String bankName;

  @NotNull(message = "Branch address cannot be null")
  private String branchAddress;

  @NotNull(message = "IFSC code cannot be null")
  private String ifscCode;

  private String city;
  private String state;

  @NotNull(message = "branch name required for account")
  private String branch;
}

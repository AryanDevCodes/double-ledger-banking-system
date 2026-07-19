package com.bank.dto.bank;

import java.util.List;
import lombok.Data;

@Data
public class BankResponseDTO {
  private String id;
  private String bankName;
  private String branch;
  private String ifscCode;
  private String city;
  private String state;
  private String branchAddress;

  // Only include account numbers to avoid circular references
  private List<String> accountNumbers;
}

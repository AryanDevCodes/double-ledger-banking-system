package com.bank.dto.composite;

import com.bank.dto.account.AccountResponseDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GlobalSearchResultDTO {
  private String query;
  private List<CustomerResponseDTO> customers;
  private List<AccountResponseDTO> accounts;
  private List<TransactionResponseDTO> transactions;
  private int totalResults;
}

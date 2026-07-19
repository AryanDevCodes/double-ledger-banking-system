package com.bank.dto.account;

import com.bank.dto.customer.CustomerRequestDTO;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountRequestDTO {
  private BigDecimal initialDeposit;
  private CustomerRequestDTO customer;
}

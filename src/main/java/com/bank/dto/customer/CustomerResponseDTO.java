package com.bank.dto.customer;

import com.bank.entity.Status;

import lombok.Data;

import java.util.List;

@Data
public
class CustomerResponseDTO {
  private String id;
  private String fullName;
  private String email;
  private String phoneNumber;
  private Status kycStatus;
  private Integer age;
  private String address;
  private Status customerStatus;
  private List<String> accountNumbers;
}

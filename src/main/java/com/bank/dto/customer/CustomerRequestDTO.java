package com.bank.dto.customer;

import com.bank.entity.Status;
import lombok.Data;

@Data
public class CustomerRequestDTO {

    private String fullName;
    private String email;
    private String phoneNumber;
    private Status kycStatus;
    private Integer age;
    private String address;

    private Status customerStatus;

    // Optional auth fields when creating an account-linked user
    private String username;
    private String password;


}

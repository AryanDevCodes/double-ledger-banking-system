package com.bank.dto.customer;

import com.bank.entity.Status;
import lombok.Data;

import java.util.List;

@Data
public class CustomerResponseDTO {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Status kycStatus;

    private Status customerStatus;

    private List<Long> accountNumbers;

}

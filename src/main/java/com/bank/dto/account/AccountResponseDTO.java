package com.bank.dto.account;

import com.bank.entity.Status;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountResponseDTO {

    private String accountNumber;
    private String currencyCode;
    private BigDecimal balance;
    private Status status;



    // Only include IDs to avoid circular references excluding entities directly
    private String bankId;
    private String bankName;
    private String customerId;
    private String customerName;
    private Integer age;
    private String address;


}

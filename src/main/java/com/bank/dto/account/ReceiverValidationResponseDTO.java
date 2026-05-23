package com.bank.dto.account;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiverValidationResponseDTO {
    private boolean valid;
    private String message;
    private String accountNumber;
    private String accountHolderName;
    private String bankName;
    private String ifscCode;
    private int matchedAccountCount;
}
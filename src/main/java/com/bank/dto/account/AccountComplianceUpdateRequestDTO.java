package com.bank.dto.account;

import com.bank.entity.Status;
import lombok.Data;

@Data
public class AccountComplianceUpdateRequestDTO {
    private Status accountStatus;
    private Status kycStatus;
    private Status customerStatus;
}

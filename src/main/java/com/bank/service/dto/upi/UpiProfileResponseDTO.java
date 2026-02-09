package com.bank.service.dto.upi;

import com.bank.entity.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpiProfileResponseDTO {

    private Long id;
    private String upiId;
    private String accountNumber;
    private String accountHolderName;
    private String bankName;
    private Status status;
    private LocalDateTime createdAt;
}


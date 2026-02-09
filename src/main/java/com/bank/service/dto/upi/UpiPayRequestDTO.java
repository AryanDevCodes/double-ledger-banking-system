package com.bank.service.dto.upi;

import com.bank.entity.Status;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class UpiPayRequestDTO {
    private Long id;

    private String idempotencyKey;

    private String fromUpi;
    private String toUpi;

    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private Status status;

}

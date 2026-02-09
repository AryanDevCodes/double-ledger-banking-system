package com.bank.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CurrentTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "upi_payment_obj",
        uniqueConstraints = @UniqueConstraint(columnNames = "idempotency_key")
)
@Getter @Setter
public class UpiPaymentOBJ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String idempotencyKey;

    private String fromUpi;
    private String toUpi;

    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private Status status;

    private Long transactionId;

    @Column(length = 500)
    private String failureReason;

    @CurrentTimestamp
    private LocalDateTime createdAt;
}

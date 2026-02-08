package com.bank.entity;


import jakarta.persistence.*;
import org.hibernate.annotations.CurrentTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "upi_profiles",
        uniqueConstraints = @UniqueConstraint(columnNames = "upi_id")
)
public class UpiProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "upi_id", nullable = false)
    private String upiId;

    @ManyToOne(fetch = FetchType.LAZY)
    private Account linkedAccount;

    @Enumerated(EnumType.STRING)
    private Status status;

    @CurrentTimestamp
    private LocalDateTime createdAt;
}

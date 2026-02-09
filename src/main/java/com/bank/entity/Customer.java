package com.bank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "customers", uniqueConstraints = {
                @UniqueConstraint(columnNames = "email"),
                @UniqueConstraint(columnNames = "phone_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "account" })
public class Customer {

        @Id
        private String id;

        @Column(nullable = false)
        private String fullName;

        @Column(nullable = false)
        private String email;

        @Column(name = "phone_number", nullable = false)
        private String phoneNumber;

        private Integer age;
        private String address;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        @Builder.Default
        private Status kycStatus = Status.PENDING;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        @Builder.Default
        private Status customerStatus = Status.ACTIVE;

        // Link to User for authentication 
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = true)
        private User user;

        @OneToMany
        @JoinColumn(name = "customer_id")
        private List<Account> account;
}

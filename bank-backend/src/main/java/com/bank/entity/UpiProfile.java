package com.bank.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CurrentTimestamp;

@Entity
@Table(name = "upi_profiles", uniqueConstraints = @UniqueConstraint(columnNames = "upi_id"))
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
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

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}

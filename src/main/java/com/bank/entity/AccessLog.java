package com.bank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "access_logs",
    indexes = {
      @Index(name = "idx_access_logs_timestamp", columnList = "timestamp"),
      @Index(name = "idx_access_logs_event_type", columnList = "event_type"),
      @Index(name = "idx_access_logs_user_id", columnList = "user_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessLog {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "timestamp", nullable = false)
  private LocalDateTime timestamp;

  @Column(name = "user_id")
  private Long userId;

  @Column(name = "user_name", nullable = false)
  private String userName;

  @Enumerated(EnumType.STRING)
  @Column(name = "event_type", nullable = false, length = 32)
  private AccessEventType eventType;

  @Column(name = "ip_address", nullable = false, length = 64)
  private String ipAddress;

  @Column(name = "user_agent", nullable = false, length = 1024)
  private String userAgent;

  @Column(name = "location", length = 128)
  private String location;

  @Column(name = "success", nullable = false)
  private boolean success;

  @PrePersist
  void prePersist() {
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
    if (timestamp == null) {
      timestamp = LocalDateTime.now();
    }
  }
}

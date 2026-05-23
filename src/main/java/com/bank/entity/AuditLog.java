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
    name = "audit_logs",
    indexes = {
      @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
      @Index(name = "idx_audit_logs_action", columnList = "action"),
      @Index(name = "idx_audit_logs_user_id", columnList = "user_id"),
      @Index(name = "idx_audit_logs_resource", columnList = "resource")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
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
  @Column(name = "action", nullable = false, length = 32)
  private AuditAction action;

  @Column(name = "resource", nullable = false, length = 128)
  private String resource;

  @Column(name = "resource_id", length = 128)
  private String resourceId;

  @Column(name = "details", length = 2000)
  private String details;

  @Column(name = "ip_address", nullable = false, length = 64)
  private String ipAddress;

  @Column(name = "user_agent", nullable = false, length = 1024)
  private String userAgent;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private AuditStatus status;

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

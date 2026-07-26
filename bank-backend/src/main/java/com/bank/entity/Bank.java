package com.bank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "banks",
    uniqueConstraints = {@UniqueConstraint(columnNames = "ifsc_code")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "accounts"})
public class Bank {

  @Id private String id;

  @Column(nullable = false)
  private String bankName;

  @Column(nullable = false)
  private String branch;

  @Column(name = "ifsc_code", nullable = false)
  private String ifscCode;

  @Column(nullable = false)
  private String city;

  @Column(nullable = false)
  private String state;

  private String branchAddress;

  @OneToMany(mappedBy = "bank", fetch = FetchType.LAZY)
  private List<Account> accounts;

  @PrePersist
  private void generateId() {
    if (this.id == null || this.id.isEmpty()) {
      this.id = bankName + "_" + generateAccountNumber();
      // ICICI_12345678901234567890
    }
  }

  private String generateAccountNumber() {
    String baseAccountNumber = UUID.randomUUID().toString().replace("-", "");
    // Limit the length of the account number
    if (baseAccountNumber.length() > 20) {
      return baseAccountNumber.substring(0, 20);
    }
    return baseAccountNumber;
  }
}

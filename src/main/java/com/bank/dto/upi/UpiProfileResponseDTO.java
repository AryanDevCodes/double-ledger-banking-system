package com.bank.dto.upi;

import com.bank.entity.Status;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class UpiProfileResponseDTO {
  private Long id;
  private String upiId;
  private String accountNumber;
  private String accountHolderName;
  private String bankName;
  private Status status;
  private LocalDateTime createdAt;
}

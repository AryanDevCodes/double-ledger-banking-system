package com.bank.dto.composite;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActionResultDTO {
  private boolean success;
  private String message;
  private String resourceId;
  private String newStatus;
  private LocalDateTime performedAt;
  private String performedBy;
}

package com.bank.dto.audit;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class AuditLogPageResponseDTO {
  private List<AuditLogEntryDTO> items;
  private int page;
  private int size;
  private long totalElements;
  private int totalPages;
  private boolean hasNext;
  private boolean hasPrevious;
}

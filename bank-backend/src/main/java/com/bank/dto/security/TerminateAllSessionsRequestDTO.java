package com.bank.dto.security;

import lombok.Data;

@Data
public class TerminateAllSessionsRequestDTO {
  private Boolean excludeCurrent;
}

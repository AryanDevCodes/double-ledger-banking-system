package com.bank.dto.card;

import java.util.List;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantBlockUpdateRequest {
  private List<String> categories;
}

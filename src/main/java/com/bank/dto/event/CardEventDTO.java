package com.bank.dto.event;

import java.time.LocalDateTime;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardEventDTO {
    private String type;
    private String message;
    private Long cardId;
    private String cardType;
    private String severity;
    private LocalDateTime occurredAt;
    private Object payload;
}

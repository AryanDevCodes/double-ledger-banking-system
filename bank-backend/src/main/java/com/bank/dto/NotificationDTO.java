package com.bank.dto;

import com.bank.entity.Notification;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private Notification.NotificationType type;
    private Boolean isRead;
    private String referenceId;
    private String referenceType;
    private LocalDateTime createdAt;
}

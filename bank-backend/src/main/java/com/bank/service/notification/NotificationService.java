package com.bank.service.notification;

import com.bank.dto.NotificationDTO;
import com.bank.dto.PagedResponse;
import com.bank.entity.Notification;
import com.bank.entity.User;
import com.bank.repository.NotificationRepository;
import com.bank.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationDTO createNotification(Long userId, String title, String message,
                                               Notification.NotificationType type,
                                               String referenceId, String referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification {} for user {}", saved.getId(), userId);
        return mapToDTO(saved);
    }

    public PagedResponse<NotificationDTO> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationDTO> content = notificationPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return PagedResponse.<NotificationDTO>builder()
                .content(content)
                .page(notificationPage.getNumber())
                .size(notificationPage.getSize())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .first(notificationPage.isFirst())
                .last(notificationPage.isLast())
                .build();
    }

    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.markAsRead(notificationId, userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void createTransactionNotification(Long userId, String accountNumber,
                                               String amount, String type,
                                               String transactionId, String otherParty) {
        Notification.NotificationType notificationType = "DEBIT".equals(type)
                ? Notification.NotificationType.TRANSACTION_DEBIT
                : Notification.NotificationType.TRANSACTION_CREDIT;

        String title = "DEBIT".equals(type)
                ? "Money Sent - ₹" + amount
                : "Money Received - ₹" + amount;

        String message = "DEBIT".equals(type)
                ? "You sent ₹" + amount + " to " + otherParty + ". Transaction ID: " + transactionId
                : "You received ₹" + amount + " from " + otherParty + ". Transaction ID: " + transactionId;

        createNotification(userId, title, message, notificationType, transactionId, "TRANSACTION");
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

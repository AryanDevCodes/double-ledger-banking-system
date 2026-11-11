package com.bank.service.notification;

import com.bank.dto.NotificationDTO;
import com.bank.dto.PagedResponse;
import com.bank.entity.Account;
import com.bank.entity.Notification;
import com.bank.entity.Transaction;
import com.bank.entity.User;
import com.bank.repository.NotificationRepository;
import com.bank.repository.TransactionRepository;
import com.bank.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final TransactionRepository transactionRepository;

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
        return mapToDTO(saved, false);
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationDTO> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationDTO> content = notificationPage.getContent().stream()
                .map(notification -> mapToDTO(notification, true))
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

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(notification -> mapToDTO(notification, true))
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
                                               BigDecimal amount, String type,
                                               String transactionId, String otherPartyName) {
        Notification.NotificationType notificationType = "DEBIT".equals(type)
                ? Notification.NotificationType.TRANSACTION_DEBIT
                : Notification.NotificationType.TRANSACTION_CREDIT;

        String formattedAmount = formatAmount(amount);
        String title = "DEBIT".equals(type)
                ? "Money Sent - " + formattedAmount
                : "Money Received - " + formattedAmount;

        String message = "DEBIT".equals(type)
                ? "To " + otherPartyName + " · " + maskedAccount(accountNumber) + " · Ref #" + transactionId
                : "From " + otherPartyName + " · " + maskedAccount(accountNumber) + " · Ref #" + transactionId;

        createNotification(userId, title, message, notificationType, transactionId, "TRANSACTION");
    }

    private String formatAmount(BigDecimal amount) {
        BigDecimal normalized = amount.setScale(2, RoundingMode.HALF_UP);
        String value = normalized.abs().toPlainString();
        int decimalPoint = value.indexOf('.');
        String integerPart = value.substring(0, decimalPoint);
        int groupEnd = integerPart.length() - 3;
        StringBuilder groupedInteger =
                new StringBuilder(integerPart.substring(Math.max(0, groupEnd)));
        while (groupEnd > 0) {
            int groupStart = Math.max(0, groupEnd - 2);
            groupedInteger.insert(0, integerPart.substring(groupStart, groupEnd) + ",");
            groupEnd = groupStart;
        }
        return "₹" + (normalized.signum() < 0 ? "-" : "") + groupedInteger + value.substring(decimalPoint);
    }

    private String maskedAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return "A/c";
        }
        String normalized = accountNumber.trim();
        return "A/c •••• " + normalized.substring(Math.max(0, normalized.length() - 4));
    }

    private NotificationDTO mapToDTO(Notification notification, boolean resolveLegacyTransaction) {
        String title = notification.getTitle();
        String message = notification.getMessage();

        if (resolveLegacyTransaction
                && (notification.getType() == Notification.NotificationType.TRANSACTION_DEBIT
                        || notification.getType() == Notification.NotificationType.TRANSACTION_CREDIT)) {
            TransactionDisplay transactionDisplay = resolveLegacyTransaction(notification);
            if (transactionDisplay != null) {
                title = transactionDisplay.title();
                message = transactionDisplay.message();
            }
        }

        return NotificationDTO.builder()
                .id(notification.getId())
                .title(title)
                .message(message)
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private TransactionDisplay resolveLegacyTransaction(Notification notification) {
        String message = notification.getMessage();
        if (message != null && (message.startsWith("To ") || message.startsWith("From "))) {
            return null;
        }
        try {
            Long transactionId = Long.valueOf(notification.getReferenceId());
            return transactionRepository.findTransactionByTransactionId(transactionId)
                    .map(transaction -> formatTransactionDisplay(notification, transaction))
                    .orElse(null);
        } catch (NumberFormatException ex) {
            log.warn(
                    "Skipping legacy transaction notification {} with invalid reference id",
                    notification.getId());
            return null;
        }
    }

    private TransactionDisplay formatTransactionDisplay(
            Notification notification, Transaction transaction) {
        boolean debit = notification.getType() == Notification.NotificationType.TRANSACTION_DEBIT;
        String otherPartyName = debit
                ? accountHolderLabel(transaction.getReceiverAccount(), transaction.getReceiverAccountNumber())
                : accountHolderLabel(transaction.getSenderAccount(), transaction.getSenderAccountNumber());
        String ownAccountNumber =
                debit ? transaction.getSenderAccountNumber() : transaction.getReceiverAccountNumber();
        String title = (debit ? "Money Sent - " : "Money Received - ") + formatAmount(transaction.getAmount());
        String message = (debit ? "To " : "From ")
                + otherPartyName
                + " · "
                + maskedAccount(ownAccountNumber)
                + " · Ref #"
                + notification.getReferenceId();
        return new TransactionDisplay(title, message);
    }

    private String accountHolderLabel(Account account, String accountNumber) {
        String fullName =
                account != null && account.getCustomer() != null
                        ? account.getCustomer().getFullName()
                        : null;
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }
        if (accountNumber == null || accountNumber.isBlank()) {
            return "the other account";
        }
        String normalized = accountNumber.trim();
        return "account ending in " + normalized.substring(Math.max(0, normalized.length() - 4));
    }

    private record TransactionDisplay(String title, String message) {}
}

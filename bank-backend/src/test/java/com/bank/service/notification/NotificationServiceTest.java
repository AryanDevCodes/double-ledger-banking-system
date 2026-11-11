package com.bank.service.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Notification;
import com.bank.entity.Transaction;
import com.bank.entity.User;
import com.bank.repository.NotificationRepository;
import com.bank.repository.TransactionRepository;
import com.bank.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

  @Mock private NotificationRepository notificationRepository;
  @Mock private UserRepository userRepository;
  @Mock private TransactionRepository transactionRepository;
  @InjectMocks private NotificationService notificationService;

  @Test
  void transactionNotificationUsesNamedCounterpartyAndIndianCurrencyFormatting() {
    User user = mock(User.class);
    when(userRepository.findById(14L)).thenReturn(Optional.of(user));
    when(notificationRepository.save(any(Notification.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    notificationService.createTransactionNotification(
        14L, "1234567890", new BigDecimal("203030.00"), "DEBIT", "TX-42", "Gaurav Sharma");

    ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
    org.mockito.Mockito.verify(notificationRepository).save(notificationCaptor.capture());
    Notification notification = notificationCaptor.getValue();
    assertThat(notification.getTitle()).isEqualTo("Money Sent - ₹2,03,030.00");
    assertThat(notification.getMessage()).isEqualTo("To Gaurav Sharma · A/c •••• 7890 · Ref #TX-42");
    assertThat(notification.getType()).isEqualTo(Notification.NotificationType.TRANSACTION_DEBIT);
  }

  @Test
  void legacyTransactionNotificationDisplaysCounterpartyNameAndMaskedAccount() {
    Notification storedNotification =
        Notification.builder()
            .id(9L)
            .title("Money Sent - ₹25.00")
            .message("You sent ₹25.00 to 9876543210. Transaction ID: 42")
            .type(Notification.NotificationType.TRANSACTION_DEBIT)
            .isRead(false)
            .referenceId("42")
            .referenceType("TRANSACTION")
            .build();
    when(notificationRepository.findByUserIdOrderByCreatedAtDesc(
            org.mockito.ArgumentMatchers.eq(14L), org.mockito.ArgumentMatchers.any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(storedNotification)));
    Transaction transaction = transaction();
    when(transactionRepository.findTransactionByTransactionId(42L))
        .thenReturn(Optional.of(transaction));

    var page = notificationService.getNotifications(14L, 0, 20);

    assertThat(page.getContent()).hasSize(1);
    assertThat(page.getContent().get(0).getTitle()).isEqualTo("Money Sent - ₹2,03,030.00");
    assertThat(page.getContent().get(0).getMessage())
        .isEqualTo("To Gaurav Sharma · A/c •••• 7890 · Ref #42");
  }

  private static Transaction transaction() {
    Customer receiverCustomer = mock(Customer.class);
    when(receiverCustomer.getFullName()).thenReturn("Gaurav Sharma");
    Account receiverAccount = mock(Account.class);
    when(receiverAccount.getCustomer()).thenReturn(receiverCustomer);

    Transaction transaction = mock(Transaction.class);
    when(transaction.getAmount()).thenReturn(new BigDecimal("203030.00"));
    when(transaction.getReceiverAccount()).thenReturn(receiverAccount);
    when(transaction.getSenderAccountNumber()).thenReturn("1234567890");
    when(transaction.getReceiverAccountNumber()).thenReturn("9876543210");
    return transaction;
  }
}

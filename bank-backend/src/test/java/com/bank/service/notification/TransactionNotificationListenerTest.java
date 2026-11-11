package com.bank.service.notification;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Notification;
import com.bank.entity.User;
import com.bank.repository.AccountRepository;
import com.bank.service.transaction.event.TransactionStatusEvent;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@ExtendWith(MockitoExtension.class)
class TransactionNotificationListenerTest {

  @Mock private EmailService emailService;
  @Mock private AccountRepository accountRepository;
  @Mock private NotificationService notificationService;
  @InjectMocks private TransactionNotificationListener listener;

  @Test
  void successfulTransferNotificationsRunAfterCommitAndNotifyBothParties() {
    Account senderAccount = account("ACC-SENDER", "sender@example.com", 1L, "Sender Name");
    Account receiverAccount = account("ACC-RECEIVER", "receiver@example.com", 2L, "Receiver Name");
    when(accountRepository.findByAccountNumber("ACC-SENDER")).thenReturn(senderAccount);
    when(accountRepository.findByAccountNumber("ACC-RECEIVER")).thenReturn(receiverAccount);
    TransactionStatusEvent event = event("transaction.completed");

    listener.handleTransactionCompleted(event);

    verify(emailService).sendTransactionDebitNotification(
        "sender@example.com", "ACC-SENDER", event.getAmount(), "ACC-RECEIVER", "1");
    verify(emailService).sendTransactionCreditNotification(
        "receiver@example.com", "ACC-RECEIVER", event.getAmount(), "ACC-SENDER", "1");
    verify(notificationService).createTransactionNotification(
        1L, "ACC-SENDER", new BigDecimal("25.00"), "DEBIT", "1", "Receiver Name");
    verify(notificationService).createTransactionNotification(
        2L, "ACC-RECEIVER", new BigDecimal("25.00"), "CREDIT", "1", "Sender Name");
    verify(notificationService, never()).createNotification(
        org.mockito.ArgumentMatchers.anyLong(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.any(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString());
  }

  @Test
  void failedTransferNotifiesSenderOnlyAndNeverSendsSuccessNotifications() {
    User sender = mock(User.class);
    when(sender.getId()).thenReturn(1L);
    Customer customer = mock(Customer.class);
    when(customer.getUser()).thenReturn(sender);
    Account senderAccount = mock(Account.class);
    when(senderAccount.getCustomer()).thenReturn(customer);
    when(accountRepository.findByAccountNumber("ACC-SENDER")).thenReturn(senderAccount);
    TransactionStatusEvent event = event("transaction.failed");

    listener.handleTransactionFailed(event);

    verify(notificationService).createNotification(
        1L,
        "Transaction Failed",
        "Your transfer of ₹25.00 failed. No funds were transferred.",
        Notification.NotificationType.SYSTEM_ALERT,
        "1",
        "TRANSACTION");
    verify(notificationService, never()).createTransactionNotification(
        org.mockito.ArgumentMatchers.anyLong(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.any(BigDecimal.class),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString());
    verify(emailService, never()).sendTransactionDebitNotification(
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.any(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString());
    verify(emailService, never()).sendTransactionCreditNotification(
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.any(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString());
  }

  @Test
  void transactionNotificationsUseCommitAndRollbackPhases() throws Exception {
    var completionMethod =
        TransactionNotificationListener.class.getMethod(
            "handleTransactionCompleted", TransactionStatusEvent.class);
    var failureMethod =
        TransactionNotificationListener.class.getMethod(
            "handleTransactionFailed", TransactionStatusEvent.class);
    TransactionalEventListener completion =
        completionMethod.getAnnotation(TransactionalEventListener.class);
    TransactionalEventListener failure =
        failureMethod.getAnnotation(TransactionalEventListener.class);

    org.assertj.core.api.Assertions.assertThat(completion.phase())
        .isEqualTo(TransactionPhase.AFTER_COMMIT);
    org.assertj.core.api.Assertions.assertThat(failure.phase())
        .isEqualTo(TransactionPhase.AFTER_ROLLBACK);
    org.assertj.core.api.Assertions.assertThat(
            completionMethod.getAnnotation(Transactional.class).propagation())
        .isEqualTo(Propagation.REQUIRES_NEW);
    org.assertj.core.api.Assertions.assertThat(
            failureMethod.getAnnotation(Transactional.class).propagation())
        .isEqualTo(Propagation.REQUIRES_NEW);
  }

  private static TransactionStatusEvent event(String eventType) {
    return TransactionStatusEvent.builder()
        .eventType(eventType)
        .transactionId(1L)
        .senderAccountNumber("ACC-SENDER")
        .receiverAccountNumber("ACC-RECEIVER")
        .amount(new BigDecimal("25.00"))
        .status(eventType.substring("transaction.".length()).toUpperCase())
        .build();
  }

  private static Account account(
      String accountNumber, String email, Long userId, String customerName) {
    User user = mock(User.class);
    when(user.getId()).thenReturn(userId);

    Customer customer = mock(Customer.class);
    when(customer.getEmail()).thenReturn(email);
    when(customer.getUser()).thenReturn(user);
    when(customer.getFullName()).thenReturn(customerName);

    Account account = mock(Account.class);
    when(account.getAccountNumber()).thenReturn(accountNumber);
    when(account.getCustomer()).thenReturn(customer);
    return account;
  }
}

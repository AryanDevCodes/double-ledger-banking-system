package com.bank.service.notification;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.bank.entity.Account;
import com.bank.entity.Notification;
import com.bank.entity.User;
import com.bank.repository.AccountRepository;
import com.bank.service.transaction.event.TransactionStatusEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionNotificationListener {

  private final EmailService emailService;
  private final AccountRepository accountRepository;
  private final NotificationService notificationService;

  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handleTransactionCompleted(TransactionStatusEvent event) {
    if (!"transaction.completed".equals(event.getEventType())) {
      return;
    }

    try {
      var senderAccount = accountRepository.findByAccountNumber(event.getSenderAccountNumber());
      var receiverAccount = accountRepository.findByAccountNumber(event.getReceiverAccountNumber());

      if (senderAccount != null && senderAccount.getCustomer() != null) {
        String senderEmail = senderAccount.getCustomer().getEmail();
        User senderUser = senderAccount.getCustomer().getUser();

        if (senderEmail != null && !senderEmail.isBlank()) {
          emailService.sendTransactionDebitNotification(
              senderEmail,
              senderAccount.getAccountNumber(),
              event.getAmount(),
              event.getReceiverAccountNumber(),
              event.getTransactionId().toString());
        }

        if (senderUser != null) {
          notificationService.createTransactionNotification(
              senderUser.getId(),
              senderAccount.getAccountNumber(),
              event.getAmount(),
              "DEBIT",
              event.getTransactionId().toString(),
              accountHolderLabel(receiverAccount, event.getReceiverAccountNumber()));
        }
      }

      if (receiverAccount != null && receiverAccount.getCustomer() != null) {
        String receiverEmail = receiverAccount.getCustomer().getEmail();
        User receiverUser = receiverAccount.getCustomer().getUser();

        if (receiverEmail != null && !receiverEmail.isBlank()) {
          emailService.sendTransactionCreditNotification(
              receiverEmail,
              receiverAccount.getAccountNumber(),
              event.getAmount(),
              event.getSenderAccountNumber(),
              event.getTransactionId().toString());
        }

        if (receiverUser != null) {
          notificationService.createTransactionNotification(
              receiverUser.getId(),
              receiverAccount.getAccountNumber(),
              event.getAmount(),
              "CREDIT",
              event.getTransactionId().toString(),
              accountHolderLabel(senderAccount, event.getSenderAccountNumber()));
        }
      }
    } catch (Exception ex) {
      log.error("Failed to send transaction notifications for tx {}", event.getTransactionId(), ex);
    }
  }

  private String accountHolderLabel(Account account, String accountNumber) {
    String customerName =
        account != null && account.getCustomer() != null
            ? account.getCustomer().getFullName()
            : null;
    if (customerName != null && !customerName.isBlank()) {
      return customerName.trim();
    }

    if (accountNumber == null || accountNumber.isBlank()) {
      return "the other account";
    }
    String normalizedAccountNumber = accountNumber.trim();
    return "account ending in "
        + normalizedAccountNumber.substring(Math.max(0, normalizedAccountNumber.length() - 4));
  }

  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
  public void handleTransactionFailed(TransactionStatusEvent event) {
    if (!"transaction.failed".equals(event.getEventType())) {
      return;
    }

    try {
      var senderAccount = accountRepository.findByAccountNumber(event.getSenderAccountNumber());
      if (senderAccount == null
          || senderAccount.getCustomer() == null
          || senderAccount.getCustomer().getUser() == null) {
        return;
      }

      notificationService.createNotification(
          senderAccount.getCustomer().getUser().getId(),
          "Transaction Failed",
          "Your transfer of ₹" + event.getAmount() + " failed. No funds were transferred.",
          Notification.NotificationType.SYSTEM_ALERT,
          event.getTransactionId().toString(),
          "TRANSACTION");
    } catch (Exception ex) {
      log.error(
          "Failed to send transaction failure notification for tx {}",
          event.getTransactionId(),
          ex);
    }
  }
}

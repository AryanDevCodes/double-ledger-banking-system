package com.bank.service.notification;

import com.bank.entity.User;
import com.bank.repository.AccountRepository;
import com.bank.repository.UserRepository;
import com.bank.service.webhook.PaymentStatusEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionNotificationListener {

  private final EmailService emailService;
  private final AccountRepository accountRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;

  @Async
  @EventListener
  public void handleTransactionCompleted(PaymentStatusEvent event) {
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
              event.getAmount().toString(),
              "DEBIT",
              event.getTransactionId().toString(),
              event.getReceiverAccountNumber());
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
              event.getAmount().toString(),
              "CREDIT",
              event.getTransactionId().toString(),
              event.getSenderAccountNumber());
        }
      }
    } catch (Exception ex) {
      log.error("Failed to send transaction notifications for tx {}", event.getTransactionId(), ex);
    }
  }
}

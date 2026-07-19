package com.bank.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Sends application e-mails. When {@code app.mail.enabled=false} (the default)
 * the message is
 * logged at WARN level instead of being delivered, which keeps local
 * development simple while
 * still letting the rest of the flow be exercised.
 */
@Service
@Slf4j
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${app.mail.enabled:false}")
  private boolean enabled;

  @Value("${app.mail.from:no-reply@bank.local}")
  private String from;

  @Value("${app.mail.reset-link-base:http://localhost:5173/reset-password}")
  private String resetLinkBase;

  @Autowired
  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  public void sendPasswordResetEmail(String toEmail, String username, String token) {
    if (toEmail == null || toEmail.isBlank() || token == null || token.isBlank()) {
      return;
    }
    String link = resetLinkBase + "?token=" + token;
    String subject = "Reset your bank account password";
    String body = "Hello "
        + (username == null ? "" : username)
        + ",\n\n"
        + "We received a request to reset your password. Use the link below to choose a new"
        + " password. This link will expire in 15 minutes.\n\n"
        + link
        + "\n\nIf you did not request this, you can safely ignore this email.\n\n"
        + "— Bank Security Team";

    sendEmail(toEmail, subject, body, "password reset");
  }

  public void sendTransactionDebitNotification(String toEmail, String accountNumber,
      BigDecimal amount, String recipientAccount, String transactionId) {
    if (toEmail == null || toEmail.isBlank()) {
      return;
    }
    String subject = "Debit Alert: ₹" + amount + " sent from your account";
    String body = String.format(
        "Dear Customer,\n\n"
            + "A debit of ₹%s has been initiated from your account %s.\n\n"
            + "Transaction Details:\n"
            + "- Amount: ₹%s\n"
            + "- To Account: %s\n"
            + "- Transaction ID: %s\n"
            + "- Time: %s\n\n"
            + "If you did not authorize this transaction, please contact us immediately.\n\n"
            + "— Bank Security Team",
        amount, accountNumber, amount, recipientAccount, transactionId,
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")));

    sendEmail(toEmail, subject, body, "debit alert");
  }

  public void sendTransactionCreditNotification(String toEmail, String accountNumber,
      BigDecimal amount, String senderAccount, String transactionId) {
    if (toEmail == null || toEmail.isBlank()) {
      return;
    }
    String subject = "Credit Alert: ₹" + amount + " received in your account";
    String body = String.format(
        "Dear Customer,\n\n"
            + "A credit of ₹%s has been received in your account %s.\n\n"
            + "Transaction Details:\n"
            + "- Amount: ₹%s\n"
            + "- From Account: %s\n"
            + "- Transaction ID: %s\n"
            + "- Time: %s\n\n"
            + "— Bank Operations Team",
        amount, accountNumber, amount, senderAccount, transactionId,
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")));

    sendEmail(toEmail, subject, body, "credit alert");
  }

  public void sendAccountCreatedNotification(String toEmail, String username,
      String accountNumber, String ifscCode) {
    if (toEmail == null || toEmail.isBlank()) {
      return;
    }
    String subject = "Welcome! Your bank account has been created";
    String body = String.format(
        "Dear %s,\n\n"
            + "Congratulations! Your bank account has been successfully created.\n\n"
            + "Account Details:\n"
            + "- Account Number: %s\n"
            + "- IFSC Code: %s\n\n"
            + "You can now use our banking services. If you have any questions, "
            + "please contact our support team.\n\n"
            + "— Bank Team",
        username, accountNumber, ifscCode);

    sendEmail(toEmail, subject, body, "account creation");
  }

  public void sendLoanApprovedNotification(String toEmail, String customerName,
      BigDecimal loanAmount, String loanType, int tenureMonths) {
    if (toEmail == null || toEmail.isBlank()) {
      return;
    }
    String subject = "Loan Approved: Your " + loanType + " loan has been sanctioned";
    String body = String.format(
        "Dear %s,\n\n"
            + "We are pleased to inform you that your %s loan has been approved.\n\n"
            + "Loan Details:\n"
            + "- Loan Amount: ₹%s\n"
            + "- Tenure: %d months\n"
            + "- Approval Date: %s\n\n"
            + "The loan amount will be credited to your account shortly. "
            + "For EMI details and repayment schedule, please login to your account.\n\n"
            + "— Bank Loans Department",
        customerName, loanType, loanAmount, tenureMonths,
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));

    sendEmail(toEmail, subject, body, "loan approval");
  }

  public void sendUpiPaymentNotification(String toEmail, String upiId,
      BigDecimal amount, String transactionType) {
    if (toEmail == null || toEmail.isBlank()) {
      return;
    }
    String subject = "UPI " + transactionType + ": ₹" + amount;
    String body = String.format(
        "Dear Customer,\n\n"
            + "An UPI transaction of ₹%s has been %s via UPI ID %s.\n\n"
            + "Transaction Details:\n"
            + "- Amount: ₹%s\n"
            + "- UPI ID: %s\n"
            + "- Type: %s\n"
            + "- Time: %s\n\n"
            + "— Bank UPI Team",
        amount, transactionType.toLowerCase(), upiId, amount, upiId, transactionType,
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")));

    sendEmail(toEmail, subject, body, "UPI notification");
  }

  private void sendEmail(String toEmail, String subject, String body, String logContext) {
    if (!enabled || mailSender == null) {
      log.warn("[mail-disabled] would send {} email to={} subject={}", logContext, toEmail, subject);
      return;
    }

    try {
      SimpleMailMessage msg = new SimpleMailMessage();
      msg.setFrom(from);
      msg.setTo(toEmail);
      msg.setSubject(subject);
      msg.setText(body);
      mailSender.send(msg);
      log.info("Sent {} email to {}", logContext, toEmail);
    } catch (Exception ex) {
      log.error("Failed to send {} email to {}", logContext, toEmail, ex);
    }
  }
}

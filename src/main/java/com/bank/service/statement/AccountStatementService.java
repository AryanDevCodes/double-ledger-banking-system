package com.bank.service.statement;

import com.bank.entity.Account;
import com.bank.entity.Transaction;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransactionRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.PageSize;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generates account statements in CSV or PDF format for a date range. The current authenticated
 * principal must own the account, unless they have an admin/manager/auditor role.
 */
@Service
@RequiredArgsConstructor
public class AccountStatementService {

  private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  private final AccountRepository accountRepository;
  private final TransactionRepository transactionRepository;

  @Transactional(readOnly = true)
  public byte[] generateCsv(String accountNumber, LocalDate from, LocalDate to) {
    StatementData data = load(accountNumber, from, to);
    StringBuilder sb = new StringBuilder();
    sb.append("Account Statement\n");
    sb.append("Account Number,").append(data.account.getAccountNumber()).append('\n');
    sb.append("Holder,").append(safe(holderName(data.account))).append('\n');
    sb.append("Bank,").append(safe(bankName(data.account))).append('\n');
    sb.append("Period,").append(data.from).append(" to ").append(data.to).append('\n');
    sb.append('\n');
    sb.append("Date,Transaction Id,Direction,Counterparty,Amount,Status\n");
    for (Transaction tx : data.transactions) {
      String direction = tx.getSenderAccountNumber() != null
          && tx.getSenderAccountNumber().equals(accountNumber) ? "DEBIT" : "CREDIT";
      String counterparty = "DEBIT".equals(direction)
          ? safe(tx.getReceiverAccountNumber())
          : safe(tx.getSenderAccountNumber());
      sb.append(tx.getTransactionDate() != null ? tx.getTransactionDate().format(TS) : "")
          .append(',')
          .append(tx.getTransactionId())
          .append(',')
          .append(direction)
          .append(',')
          .append(escapeCsv(counterparty))
          .append(',')
          .append(tx.getAmount())
          .append(',')
          .append(tx.getStatus())
          .append('\n');
    }
    return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
  }

  @Transactional(readOnly = true)
  public byte[] generatePdf(String accountNumber, LocalDate from, LocalDate to) {
    StatementData data = load(accountNumber, from, to);
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    Document doc = new Document(PageSize.A4, 36, 36, 48, 36);
    try {
      PdfWriter.getInstance(doc, out);
      doc.open();

      Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
      Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
      Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

      Paragraph title = new Paragraph("Account Statement", titleFont);
      title.setAlignment(Element.ALIGN_CENTER);
      title.setSpacingAfter(12f);
      doc.add(title);

      doc.add(kvLine("Account Number: ", data.account.getAccountNumber(), normalFont));
      doc.add(kvLine("Holder: ", holderName(data.account), normalFont));
      doc.add(kvLine("Bank: ", bankName(data.account), normalFont));
      doc.add(kvLine("Period: ", data.from + "  to  " + data.to, normalFont));
      doc.add(new Paragraph(" "));

      PdfPTable table = new PdfPTable(new float[] {3.2f, 1.6f, 1.2f, 2.2f, 1.6f, 1.4f});
      table.setWidthPercentage(100);
      addHeader(table, headerFont, "Date", "Txn Id", "Type", "Counterparty", "Amount", "Status");

      for (Transaction tx : data.transactions) {
        boolean debit = tx.getSenderAccountNumber() != null
            && tx.getSenderAccountNumber().equals(accountNumber);
        String counterparty = debit ? safe(tx.getReceiverAccountNumber()) : safe(tx.getSenderAccountNumber());
        addRow(
            table,
            normalFont,
            tx.getTransactionDate() != null ? tx.getTransactionDate().format(TS) : "",
            String.valueOf(tx.getTransactionId()),
            debit ? "DEBIT" : "CREDIT",
            counterparty,
            tx.getAmount() != null ? tx.getAmount().toPlainString() : "",
            tx.getStatus() != null ? tx.getStatus().name() : "");
      }
      doc.add(table);

      Paragraph footer =
          new Paragraph(
              "Generated " + LocalDateTime.now().format(TS) + ". This is a system-generated"
                  + " document.",
              FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8));
      footer.setSpacingBefore(12f);
      footer.setAlignment(Element.ALIGN_CENTER);
      doc.add(footer);
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to render PDF statement", ex);
    } finally {
      if (doc.isOpen()) doc.close();
    }
    return out.toByteArray();
  }

  // --- internals -------------------------------------------------------------------------------

  private StatementData load(String accountNumber, LocalDate from, LocalDate to) {
    if (accountNumber == null || accountNumber.isBlank()) {
      throw new IllegalArgumentException("accountNumber is required");
    }
    Account account = accountRepository.findByAccountNumber(accountNumber);
    if (account == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
    }

    enforceAccess(account);

    LocalDate effFrom = from != null ? from : LocalDate.now().minusMonths(1);
    LocalDate effTo = to != null ? to : LocalDate.now();
    LocalDateTime fromTs = effFrom.atStartOfDay();
    LocalDateTime toTs = effTo.plusDays(1).atStartOfDay();

    String email = account.getCustomer() != null ? account.getCustomer().getEmail() : null;
    List<Transaction> all =
        email == null
            ? List.of()
            : transactionRepository.findTransactionByAccountNumberAndEmail(accountNumber, email);

    List<Transaction> filtered =
        all.stream()
            .filter(t -> t.getTransactionDate() != null)
            .filter(
                t ->
                    !t.getTransactionDate().isBefore(fromTs)
                        && t.getTransactionDate().isBefore(toTs))
            .sorted(Comparator.comparing(Transaction::getTransactionDate))
            .toList();

    return new StatementData(account, effFrom, effTo, filtered);
  }

  private void enforceAccess(Account account) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new AccessDeniedException("Authentication required");
    }
    boolean privileged =
        auth.getAuthorities().stream()
            .map(a -> a.getAuthority())
            .anyMatch(
                role ->
                    role.equals("ROLE_ADMIN")
                        || role.equals("ROLE_MANAGER")
                        || role.equals("ROLE_AUDITOR")
                        || role.equals("ROLE_CUSTOMER_MANAGER"));
    if (privileged) return;

    String principal = auth.getName();
    String ownerUsername =
        account.getCustomer() != null && account.getCustomer().getUser() != null
            ? account.getCustomer().getUser().getUsername()
            : null;
    String ownerEmail = account.getCustomer() != null ? account.getCustomer().getEmail() : null;
    if (principal == null
        || (!principal.equalsIgnoreCase(ownerUsername)
            && !principal.equalsIgnoreCase(ownerEmail))) {
      throw new AccessDeniedException("You can only download your own statements");
    }
  }

  private static String holderName(Account a) {
    return a.getCustomer() != null ? a.getCustomer().getFullName() : null;
  }

  private static String bankName(Account a) {
    return a.getBank() != null ? a.getBank().getBankName() : null;
  }

  private static String safe(String s) {
    return s == null ? "" : s;
  }

  private static String escapeCsv(String s) {
    if (s == null) return "";
    if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
      return "\"" + s.replace("\"", "\"\"") + "\"";
    }
    return s;
  }

  private static Paragraph kvLine(String key, String value, Font font) {
    Paragraph p = new Paragraph();
    Font keyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    p.add(new com.lowagie.text.Chunk(key, keyFont));
    p.add(new com.lowagie.text.Chunk(value == null ? "" : value, font));
    return p;
  }

  private static void addHeader(PdfPTable table, Font font, String... titles) {
    for (String t : titles) {
      PdfPCell c = new PdfPCell(new Phrase(t, font));
      c.setHorizontalAlignment(Element.ALIGN_LEFT);
      c.setPaddingBottom(6f);
      table.addCell(c);
    }
  }

  private static void addRow(PdfPTable table, Font font, String... values) {
    for (String v : values) {
      PdfPCell c = new PdfPCell(new Phrase(v == null ? "" : v, font));
      c.setPaddingBottom(4f);
      table.addCell(c);
    }
  }

  private record StatementData(
      Account account, LocalDate from, LocalDate to, List<Transaction> transactions) {}

  // Suppress an unused import warning for BigDecimal — retained to make future totals trivial.
  @SuppressWarnings("unused")
  private static BigDecimal zero() {
    return BigDecimal.ZERO;
  }
}

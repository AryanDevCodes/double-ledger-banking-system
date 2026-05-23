package com.bank.controller;

import com.bank.service.statement.AccountStatementService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Exports an account statement for a given date range.
 *
 * <p>
 * Examples:
 *
 * <pre>
 *   GET /api/accounts/{accountNumber}/statement?format=csv&amp;from=2025-01-01&amp;to=2025-01-31
 *   GET /api/accounts/{accountNumber}/statement?format=pdf
 * </pre>
 *
 * If {@code from}/{@code to} are omitted the last calendar month is used.
 */
@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
public class StatementController {

  private final AccountStatementService statementService;

  @PreAuthorize("isAuthenticated()")
  @GetMapping("/{accountNumber}/statement")
  public ResponseEntity<byte[]> exportStatement(
      @PathVariable String accountNumber,
      @RequestParam(value = "format", defaultValue = "csv") String format,
      @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

    String fmt = format == null ? "csv" : format.trim().toLowerCase();

    byte[] body;
    MediaType contentType;
    String filename;
    switch (fmt) {
      case "pdf" -> {
        body = statementService.generatePdf(accountNumber, from, to);
        contentType = MediaType.APPLICATION_PDF;
        filename = "statement-" + accountNumber + ".pdf";
      }
      case "csv" -> {
        body = statementService.generateCsv(accountNumber, from, to);
        contentType = MediaType.parseMediaType("text/csv");
        filename = "statement-" + accountNumber + ".csv";
      }
      default -> {
        return ResponseEntity.badRequest().build();
      }
    }

    return ResponseEntity.ok()
        .contentType(contentType)
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + filename + "\"")
        .body(body);
  }
}

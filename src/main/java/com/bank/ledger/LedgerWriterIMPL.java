package com.bank.ledger;

import com.bank.entity.Ledger;
import com.bank.exception.InvalidDataException;
import com.bank.repository.LedgerRepository;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LedgerWriterIMPL implements LedgerWriter {
  private final LedgerRepository ledgerRepository;

  @Override
  public void postDebit(Long accountId, BigDecimal amount, String refId) {
    validate(amount);
    Ledger ledger = new Ledger(accountId, amount, refId, EntryType.DEBIT);
    ledgerRepository.save(ledger);
  }

  @Override
  public void postCredit(Long accountId, BigDecimal amount, String refId) {
    validate(amount);
    Ledger ledger = new Ledger(accountId, amount, refId, EntryType.CREDIT);
    ledgerRepository.save(ledger);
  }

  private void validate(BigDecimal amount) {
    if (amount == null || amount.signum() <= 0) {
      throw new InvalidDataException("Amount must be positive");
    }
  }
}

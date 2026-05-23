package com.bank.ledger;

import com.bank.entity.Account;
import com.bank.entity.Ledger;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.LedgerRepository;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LedgerWriterIMPL implements LedgerWriter {
  private final LedgerRepository ledgerRepository;
  private final AccountRepository accountRepository;

  @Override
  public void postDebit(Long accountId, BigDecimal amount, String refId) {
    validate(amount);
    Account account = accountRepository.findById(accountId)
        .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));
    Ledger ledger = new Ledger(account, amount, refId, EntryType.DEBIT);
    ledgerRepository.save(ledger);
  }

  @Override
  public void postCredit(Long accountId, BigDecimal amount, String refId) {
    validate(amount);
    Account account = accountRepository.findById(accountId)
        .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));
    Ledger ledger = new Ledger(account, amount, refId, EntryType.CREDIT);
    ledgerRepository.save(ledger);
  }

  private void validate(BigDecimal amount) {
    if (amount == null || amount.signum() <= 0) {
      throw new InvalidDataException("Amount must be positive");
    }
  }
}

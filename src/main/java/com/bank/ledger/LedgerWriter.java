package com.bank.ledger;

import java.math.BigDecimal;

public interface LedgerWriter {
  void postDebit(Long accountId, BigDecimal amount, String refId);

  void postCredit(Long accountId, BigDecimal amount, String refId);
}

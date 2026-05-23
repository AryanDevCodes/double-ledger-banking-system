package com.bank.service.transaction;

import com.bank.entity.Account;

/**
 * * Value object for holding locked sender and receiver accounts. * This is used to maintain
 * deterministic locking order and prevent deadlocks.
 */
record LockedAccounts(Account sender, Account receiver) {}

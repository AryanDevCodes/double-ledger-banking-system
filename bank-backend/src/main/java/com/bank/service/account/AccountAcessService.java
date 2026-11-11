package com.bank.service.account;

import java.nio.file.AccessDeniedException;

import org.springframework.stereotype.Service;

import com.bank.entity.Account;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;

@Service
public class AccountAcessService {

    private final AccountRepository accountRepository;

    public AccountAcessService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public Account giveAccountOwnership(Long accountId, Long userId) throws AccessDeniedException {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Account", "id", accountId));
        boolean isOwner = account.getCustomer()
                .getUser()
                .getId()
                .equals(userId);

        if (!isOwner) {
            throw new AccessDeniedException(
                    "You cannot access this account"
            );
        }
        return account;
    }

}

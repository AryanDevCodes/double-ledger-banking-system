package com.bank.service.account;

import com.bank.dto.PagedResponse;
import com.bank.dto.account.AccountComplianceUpdateRequestDTO;
import com.bank.dto.account.AccountLedgerBalanceDTO;
import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.dto.account.ReceiverValidationResponseDTO;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface AccountsService {
        List<AccountResponseDTO> findAll();

        PagedResponse<AccountResponseDTO> findAllPaginated(Pageable pageable);

        List<AccountResponseDTO> findByBank(String bankName);

        List<AccountResponseDTO> findByCustomerEmail(String email);

        List<AccountResponseDTO> findByUserId(Long userId);

        AccountResponseDTO findByAccountNumber(String accountNumber);

        ReceiverValidationResponseDTO validateReceiverDetails(
                        String bankName, String ifscCode, String holderName);

        ReceiverValidationResponseDTO lookupByAccountNumber(String accountNumber);

        AccountResponseDTO createAccount(String bankName, AccountRequestDTO dto);

        AccountResponseDTO updateAccount(String accountNumber, AccountRequestDTO dto);

        AccountResponseDTO updateAccountCompliance(
                        String accountNumber, AccountComplianceUpdateRequestDTO dto);

        void deleteAccount(String accountNumber);

        AccountLedgerBalanceDTO getLedgerBalance(String accountNumber);
}

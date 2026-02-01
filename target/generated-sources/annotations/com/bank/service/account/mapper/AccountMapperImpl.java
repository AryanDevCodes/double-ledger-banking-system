package com.bank.service.account.mapper;

import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Bank;
import com.bank.entity.Customer;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-01T03:16:31+0530",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.8 (Oracle Corporation)"
)
@Component
public class AccountMapperImpl implements AccountMapper {

    @Override
    public Account toEntity(AccountRequestDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Account.AccountBuilder account = Account.builder();

        account.balance( dto.getInitialDeposit() );
        account.currencyCode( dto.getCurrencyCode() );

        return account.build();
    }

    @Override
    public AccountResponseDTO toResponseDTO(Account account) {
        if ( account == null ) {
            return null;
        }

        AccountResponseDTO accountResponseDTO = new AccountResponseDTO();

        accountResponseDTO.setBankId( accountBankId( account ) );
        accountResponseDTO.setBankName( accountBankBankName( account ) );
        accountResponseDTO.setCustomerId( accountCustomerId( account ) );
        accountResponseDTO.setCustomerName( accountCustomerFullName( account ) );
        accountResponseDTO.setAccountNumber( account.getAccountNumber() );
        accountResponseDTO.setCurrencyCode( account.getCurrencyCode() );
        accountResponseDTO.setBalance( account.getBalance() );
        accountResponseDTO.setStatus( account.getStatus() );

        return accountResponseDTO;
    }

    private String accountBankId(Account account) {
        Bank bank = account.getBank();
        if ( bank == null ) {
            return null;
        }
        return bank.getId();
    }

    private String accountBankBankName(Account account) {
        Bank bank = account.getBank();
        if ( bank == null ) {
            return null;
        }
        return bank.getBankName();
    }

    private String accountCustomerId(Account account) {
        Customer customer = account.getCustomer();
        if ( customer == null ) {
            return null;
        }
        return customer.getId();
    }

    private String accountCustomerFullName(Account account) {
        Customer customer = account.getCustomer();
        if ( customer == null ) {
            return null;
        }
        return customer.getFullName();
    }
}

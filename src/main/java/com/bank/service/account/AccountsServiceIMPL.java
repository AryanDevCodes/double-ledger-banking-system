package com.bank.service.account;

import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Bank;
import com.bank.entity.Customer;
import com.bank.entity.Status;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.ledger.LedgerWriter;
import com.bank.repository.AccountRepository;
import com.bank.repository.BankRepository;
import com.bank.repository.CustomerRepository;
import com.bank.service.account.mapper.AccountMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountsServiceIMPL implements AccountsService{
    private final AccountRepository accountRepository;
    private final AccountMapper accountMapper;
    private final BankRepository bankRepository;
    private final CustomerRepository customerRepository;
    private final LedgerWriter ledgerWriter;

    @Override
    public List<AccountResponseDTO> findAll() {
        List<Account> accounts = accountRepository.findAll();
        return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AccountResponseDTO> findByBank( String bankName ) {
        if ( bankName == null || bankName.isEmpty() ) {
            throw new InvalidDataException("bankName can't be null or empty");
        }
        List<Account> account = accountRepository.findByBankBankName(bankName);

        return account.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public AccountResponseDTO findByAccountNumber( String accountNumber ) {
        if ( accountNumber == null ) {
            throw  new InvalidDataException("accountNumber can't be null");
        }
        Account account = accountRepository.findByAccountNumber(accountNumber);
        return accountMapper.toResponseDTO(account);
    }

    @Override
    public AccountResponseDTO createAccount(String bankName, AccountRequestDTO dto) {
        // Validate input parameters
        validateCreateAccountRequest(bankName,dto);

        // Find the bank
        Bank bank = resolveBank(bankName);
        // Find or create customer
        Customer customer = customerRepository.findCustomerByFullNameAndEmailAndPhoneNumber(
                dto.getCustomer().getFullName(),
                dto.getCustomer().getEmail(),
                dto.getCustomer().getPhoneNumber());
        if (customer == null) {
            // Create new customer if not exists
            customer = Customer.builder()
                    .id(bankName + "_" + generateAccountNumber())
                    .fullName(dto.getCustomer().getFullName())
                    .email(dto.getCustomer().getEmail())
                    .age(dto.getCustomer().getAge())
                    .address(dto.getCustomer().getAddress())
                    .phoneNumber(dto.getCustomer().getPhoneNumber())
                    .kycStatus(dto.getCustomer().getKycStatus() != null ? dto.getCustomer().getKycStatus() : Status.PENDING)
                    .customerStatus(dto.getCustomer().getCustomerStatus() != null ? dto.getCustomer().getCustomerStatus() : Status.ACTIVE)
                    .build();
            customer = customerRepository.save(customer);
        }

        // Create account
        Account account = accountMapper.toEntity(dto);
        account.setAccountNumber("ACC_" + bankName + "_" + generateAccountNumber());

        account.setCustomer(customer);
        account.setBank(bank);
        account.setBalance(BigDecimal.ZERO);
        Account savedAccount = accountRepository.save(account);
        if ( dto.getInitialDeposit().compareTo(BigDecimal.ZERO) >= 0 ) {
            ledgerWriter.postCredit(
                    savedAccount.getId(),
                    dto.getInitialDeposit(),
                    "OPENING_BALANCE"
            );
        }
        // Temporary sync
        savedAccount.setBalance(dto.getInitialDeposit());
        accountRepository.save(savedAccount);

        return accountMapper.toResponseDTO(savedAccount);
    }

    @Override
    public AccountResponseDTO updateAccount( String accountNumber, AccountRequestDTO dto ) {
        // Validate input parameters
        if ( accountNumber == null ) {
            throw new InvalidDataException("Account number cannot be null", "accountNumber", null);
        }
        if ( dto == null ) {
            throw new InvalidDataException("Account data cannot be null", "accountRequestDTO", null);
        }

        // Find the account
        Account account = accountRepository.findByAccountNumber(accountNumber);
        if ( account == null ) {
            throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
        }

        // Update account fields
        if ( dto.getInitialDeposit() != null ) {
            if ( dto.getInitialDeposit().compareTo(BigDecimal.ZERO) < 0 ) {
                throw new InvalidDataException("Balance cannot be negative", "balance", dto.getInitialDeposit());
            }
            account.setBalance(dto.getInitialDeposit());
        }

        return accountMapper.toResponseDTO(accountRepository.save(account));
    }

    @Override
    public void deleteAccount( String accountNumber ) {
        // Validate input parameter
        if ( accountNumber == null ) {
            throw new InvalidDataException("Account number cannot be null", "accountNumber", null);
        }

        // Find the account
        Account account = accountRepository.findByAccountNumber(accountNumber);
        if ( account == null ) {
            throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
        }

        // Delete the account
        accountRepository.delete(account);
    }
    private String generateAccountNumber() {
        String baseAccountNumber =UUID.randomUUID().toString().replace("-", "");

        // Limit the length of the account number
        if (baseAccountNumber.length() > 20 ) {
            return baseAccountNumber.substring(0, 20);
        }
        return baseAccountNumber;
    }
    private void validateCreateAccountRequest(String bankName, AccountRequestDTO dto){
        if ( bankName == null || bankName.isBlank() ){
            throw new InvalidDataException("Bank name cannot be null or empty", "bankName", bankName);
        }
        if ( dto == null || dto.getCustomer() == null ){
            throw new InvalidDataException("Customer data is required");
        }
        if ( dto.getInitialDeposit() == null || dto.getInitialDeposit().compareTo(BigDecimal.ZERO) < 0 ){
            throw new InvalidDataException("Initial deposit must be a positive value");
        }
    }

    private Bank resolveBank(String bankName){
        Bank bank  = bankRepository.findByBankName(bankName);
        if ( bank == null ) {

            throw new ResourceNotFoundException("Bank", "bankName", bankName);
        }
        return bank;
    }
}

package com.bank.service.account;

import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.dto.account.AccountComplianceUpdateRequestDTO;
import com.bank.entity.Account;
import com.bank.entity.Bank;
import com.bank.entity.Customer;
import com.bank.entity.Status;
import com.bank.entity.User;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.ledger.LedgerWriter;
import com.bank.repository.AccountRepository;
import com.bank.repository.BankRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.RoleRepository;
import com.bank.repository.UserRepository;
import com.bank.service.account.mapper.AccountMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class AccountsServiceIMPL implements AccountsService {
    private final AccountRepository accountRepository;
    private final AccountMapper accountMapper;
    private final BankRepository bankRepository;
    private final CustomerRepository customerRepository;
    private final LedgerWriter ledgerWriter;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<AccountResponseDTO> findAll() {
        List<Account> accounts = accountRepository.findAll();
        return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AccountResponseDTO> findByBank(String bankName) {
        if (bankName == null || bankName.isEmpty()) {
            throw new InvalidDataException("bankName can't be null or empty");
        }
        List<Account> account = accountRepository.findByBankBankName(bankName);

        return account.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AccountResponseDTO> findByCustomerEmail(String email) {
        if (email == null || email.isEmpty()) {
            throw new InvalidDataException("email can't be null or empty");
        }
        List<Account> accounts = accountRepository.findByCustomerEmail(email);
        return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AccountResponseDTO> findByUserId(Long userId) {
        if (userId == null) {
            throw new InvalidDataException("userId can't be null");
        }
        List<Account> accounts = accountRepository.findByCustomerUserId(userId);
        return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public AccountResponseDTO findByAccountNumber(String accountNumber) {
        if (accountNumber == null) {
            throw new InvalidDataException("accountNumber can't be null");
        }
        Account account = accountRepository.findByAccountNumber(accountNumber);
        return accountMapper.toResponseDTO(account);
    }

    @Override
    @Transactional
    public AccountResponseDTO createAccount(String bankName, AccountRequestDTO dto) {
        // Validate input parameters
        validateCreateAccountRequest(bankName, dto);

        // Find the bank
        Bank bank = resolveBank(bankName);

        UserCreationResult userResult = resolveOrCreateUser(dto);
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
                    .kycStatus(dto.getCustomer().getKycStatus() != null ? dto.getCustomer().getKycStatus()
                            : Status.PENDING)
                    .customerStatus(
                            dto.getCustomer().getCustomerStatus() != null ? dto.getCustomer().getCustomerStatus()
                                    : Status.ACTIVE)
                    .user(userResult.user())
                    .build();
            customer = customerRepository.save(customer);
        } else if (customer.getUser() == null) {
            customer.setUser(userResult.user());
            customerRepository.save(customer);
        }

        // Create account
        Account account = accountMapper.toEntity(dto);
        account.setAccountNumber("ACC_" + bankName + "_" + generateAccountNumber());

        account.setCustomer(customer);
        account.setBank(bank);
        account.setBalance(BigDecimal.ZERO);
        Account savedAccount = accountRepository.save(account);
        if (dto.getInitialDeposit().compareTo(BigDecimal.ZERO) >= 0) {
            ledgerWriter.postCredit(
                    savedAccount.getId(),
                    dto.getInitialDeposit(),
                    "OPENING_BALANCE");
        }
        // Temporary sync
        savedAccount.setBalance(dto.getInitialDeposit());
        accountRepository.save(savedAccount);

        AccountResponseDTO response = accountMapper.toResponseDTO(savedAccount);
        response.setTemporaryPassword(userResult.generatedPassword());
        return response;
    }

    @Override
    @Transactional
    public AccountResponseDTO updateAccount(String accountNumber, AccountRequestDTO dto) {
        // Validate input parameters
        if (accountNumber == null) {
            throw new InvalidDataException("Account number cannot be null", "accountNumber", null);
        }
        if (dto == null) {
            throw new InvalidDataException("Account data cannot be null", "accountRequestDTO", null);
        }

        // Find the account
        Account account = accountRepository.findByAccountNumber(accountNumber);
        if (account == null) {
            throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
        }

        // Update account fields
        if (dto.getInitialDeposit() != null) {
            if (dto.getInitialDeposit().compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidDataException("Balance cannot be negative", "balance", dto.getInitialDeposit());
            }
            account.setBalance(dto.getInitialDeposit());
        }

        return accountMapper.toResponseDTO(accountRepository.save(account));
    }

    @Override
    @Transactional
    public AccountResponseDTO updateAccountCompliance(String accountNumber, AccountComplianceUpdateRequestDTO dto) {
        if (accountNumber == null || accountNumber.isBlank()) {
            throw new InvalidDataException("Account number cannot be null", "accountNumber", null);
        }
        if (dto == null) {
            throw new InvalidDataException("Compliance payload cannot be null", "accountComplianceUpdateRequestDTO",
                    null);
        }

        Account account = accountRepository.findByAccountNumber(accountNumber);
        if (account == null) {
            throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
        }

        if (dto.getAccountStatus() != null) {
            account.setStatus(dto.getAccountStatus());
        }

        Customer customer = account.getCustomer();
        if (customer != null) {
            if (dto.getKycStatus() != null) {
                customer.setKycStatus(dto.getKycStatus());
            }
            if (dto.getCustomerStatus() != null) {
                customer.setCustomerStatus(dto.getCustomerStatus());
            }
            customerRepository.save(customer);
        }

        Account updated = accountRepository.save(account);
        return accountMapper.toResponseDTO(updated);
    }

    @Override
    @Transactional
    public void deleteAccount(String accountNumber) {
        // Validate input parameter
        if (accountNumber == null) {
            throw new InvalidDataException("Account number cannot be null", "accountNumber", null);
        }

        // Find the account
        Account account = accountRepository.findByAccountNumber(accountNumber);
        if (account == null) {
            throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
        }

        // Delete the account
        accountRepository.delete(account);
    }

    private String generateAccountNumber() {
        String baseAccountNumber = UUID.randomUUID().toString().replace("-", "");

        // Limit the length of the account number
        if (baseAccountNumber.length() > 20) {
            return baseAccountNumber.substring(0, 20);
        }
        return baseAccountNumber;
    }

    private void validateCreateAccountRequest(String bankName, AccountRequestDTO dto) {
        if (bankName == null || bankName.isBlank()) {
            throw new InvalidDataException("Bank name cannot be null or empty", "bankName", bankName);
        }
        if (dto == null || dto.getCustomer() == null) {
            throw new InvalidDataException("Customer data is required");
        }
        if (dto.getInitialDeposit() == null || dto.getInitialDeposit().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidDataException("Initial deposit must be a positive value");
        }
        if (!StringUtils.hasText(dto.getCustomer().getEmail())) {
            throw new InvalidDataException("Customer email is required", "email", dto.getCustomer().getEmail());
        }
        if (!StringUtils.hasText(dto.getCustomer().getPhoneNumber())) {
            throw new InvalidDataException("Customer phone number is required", "phoneNumber",
                    dto.getCustomer().getPhoneNumber());
        }
        if (!StringUtils.hasText(dto.getCustomer().getFullName())) {
            throw new InvalidDataException("Customer full name is required", "fullName",
                    dto.getCustomer().getFullName());
        }
    }

    private Bank resolveBank(String bankName) {
        Bank bank = bankRepository.findByBankName(bankName);
        if (bank == null) {

            throw new ResourceNotFoundException("Bank", "bankName", bankName);
        }
        return bank;
    }

    private UserCreationResult resolveOrCreateUser(AccountRequestDTO dto) {
        String requestedUsername = dto.getCustomer().getUsername();
        String username = StringUtils.hasText(requestedUsername) ? requestedUsername.trim()
                : dto.getCustomer().getEmail();
        if (!StringUtils.hasText(username)) {
            throw new InvalidDataException("Username or email is required to create linked user", "username",
                    requestedUsername);
        }

        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(dto.getCustomer().getEmail()))
                .map(existing -> new UserCreationResult(existing, null))
                .orElseGet(() -> createUser(dto, username));
    }

    private UserCreationResult createUser(AccountRequestDTO dto, String username) {
        var role = roleRepository.findByName(com.bank.entity.Role.RoleName.ROLE_USER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_USER"));

        String rawPassword = StringUtils.hasText(dto.getCustomer().getPassword())
                ? dto.getCustomer().getPassword().trim()
                : generateTemporaryPassword();

        User user = new User();
        user.setUsername(username);
        user.setEmail(dto.getCustomer().getEmail());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setFullName(dto.getCustomer().getFullName());
        user.setPhoneNumber(dto.getCustomer().getPhoneNumber());
        user.setActive(true);
        user.setLocked(false);
        user.setRoles(Set.of(role));

        User saved = userRepository.save(user);
        return new UserCreationResult(saved, rawPassword);
    }

    private String generateTemporaryPassword() {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private record UserCreationResult(User user, String generatedPassword) {
    }
}

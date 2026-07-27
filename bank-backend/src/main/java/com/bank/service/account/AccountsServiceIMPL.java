package com.bank.service.account;

import com.bank.dto.PagedResponse;
import com.bank.dto.account.AccountComplianceUpdateRequestDTO;
import com.bank.dto.account.AccountLedgerBalanceDTO;
import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.dto.account.ReceiverValidationResponseDTO;
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
import com.bank.repository.LedgerRepository;
import com.bank.repository.RoleRepository;
import com.bank.repository.UserRepository;
import com.bank.service.account.mapper.AccountMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AccountsServiceIMPL implements AccountsService {
  private final AccountRepository accountRepository;
  private final AccountMapper accountMapper;
  private final BankRepository bankRepository;
  private final CustomerRepository customerRepository;
  private final LedgerWriter ledgerWriter;
  private final LedgerRepository ledgerRepository;
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public List<AccountResponseDTO> findAll() {
    // Allow admins to see all accounts system-wide, regular users see their
    // accounts across all banks
    if (isAdminUser()) {
      List<Account> accounts = accountRepository.findAllWithDetails();
      return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    // Get current user and return all their accounts across all banks
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getName() == null) {
      return List.of();
    }
    String username = authentication.getName();
    User user = userRepository.findByUsername(username).orElse(null);
    if (user == null) {
      return List.of();
    }
    List<Account> accounts = accountRepository.findByCustomerUserId(user.getId());
    return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
  }

  @Override
  public PagedResponse<AccountResponseDTO> findAllPaginated(Pageable pageable) {
    Page<Account> accountPage = accountRepository.findAll(pageable);
    List<AccountResponseDTO> content = accountPage.getContent().stream()
        .map(accountMapper::toResponseDTO)
        .collect(Collectors.toList());
    return PagedResponse.of(content, pageable.getPageNumber(), pageable.getPageSize(), accountPage.getTotalElements());
  }

  @Override
  public List<AccountResponseDTO> findByBank(String bankName) {
    if (bankName == null || bankName.isEmpty()) {
      throw new InvalidDataException("bankName can't be null or empty");
    }

    // Admins can access any bank's accounts, regular users can view any bank
    List<Account> account = accountRepository.findByBankBankName(bankName);

    return account.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
  }

  @Override
  public List<AccountResponseDTO> findByCustomerEmail(String email) {
    if (email == null || email.isEmpty()) {
      throw new InvalidDataException("email can't be null or empty");
    }

    // Search by email across all banks
    List<Account> accounts = accountRepository.findByCustomerEmail(email);
    return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
  }

  @Override
  public List<AccountResponseDTO> findByUserId(Long userId) {
    // Allow admins to fetch all accounts when no userId specified
    if (userId == null && isAdminUser()) {
      return accountRepository.findAllWithDetails().stream().map(accountMapper::toResponseDTO)
          .collect(Collectors.toList());
    }

    // Return all accounts for the user across all banks
    if (userId != null) {
      List<Account> accounts = accountRepository.findByCustomerUserId(userId);
      return accounts.stream().map(accountMapper::toResponseDTO).collect(Collectors.toList());
    }

    return List.of();
  }

  @Override
  public AccountResponseDTO findByAccountNumber(String accountNumber) {
    if (accountNumber == null) {
      throw new InvalidDataException("accountNumber can't be null");
    }
    Account account = accountRepository.findByAccountNumberWithDetails(accountNumber);
    if (account == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
    }
    return accountMapper.toResponseDTO(account);
  }

  @Override
  public ReceiverValidationResponseDTO validateReceiverDetails(
      String bankName, String ifscCode, String holderName) {
    if (!StringUtils.hasText(bankName) || !StringUtils.hasText(ifscCode) || !StringUtils.hasText(holderName)) {
      return ReceiverValidationResponseDTO.builder()
          .valid(false)
          .message("Enter receiver bank name, IFSC code, and holder name")
          .matchedAccountCount(0)
          .build();
    }

    List<Account> matches = accountRepository.findReceiverMatches(
        bankName.trim(), ifscCode.trim(), holderName.trim(), Status.ACTIVE);

    if (matches.isEmpty()) {
      return ReceiverValidationResponseDTO.builder()
          .valid(false)
          .message("No active receiver account matches the entered bank details")
          .bankName(bankName.trim())
          .ifscCode(ifscCode.trim())
          .accountHolderName(holderName.trim())
          .matchedAccountCount(0)
          .build();
    }

    if (matches.size() > 1) {
      return ReceiverValidationResponseDTO.builder()
          .valid(false)
          .message("Multiple matching accounts were found. Please confirm the receiver details.")
          .bankName(bankName.trim())
          .ifscCode(ifscCode.trim())
          .accountHolderName(holderName.trim())
          .matchedAccountCount(matches.size())
          .build();
    }

    Account account = matches.getFirst();
    return ReceiverValidationResponseDTO.builder()
        .valid(true)
        .message("Receiver details verified")
        .accountNumber(account.getAccountNumber())
        .accountHolderName(account.getCustomer().getFullName())
        .bankName(account.getBank().getBankName())
        .ifscCode(account.getBank().getIfscCode())
        .matchedAccountCount(1)
        .build();
  }

  @Override
  public ReceiverValidationResponseDTO lookupByAccountNumber(String accountNumber) {
    if (!StringUtils.hasText(accountNumber)) {
      return ReceiverValidationResponseDTO.builder()
          .valid(false)
          .message("Account number is required")
          .matchedAccountCount(0)
          .build();
    }

    Account account = accountRepository.findByAccountNumberWithDetails(accountNumber.trim());

    if (account == null) {
      return ReceiverValidationResponseDTO.builder()
          .valid(false)
          .message("No account found with the given account number")
          .matchedAccountCount(0)
          .build();
    }

    if (account.getStatus() != Status.ACTIVE) {
      return ReceiverValidationResponseDTO.builder()
          .valid(false)
          .message("Account is not active")
          .accountNumber(account.getAccountNumber())
          .matchedAccountCount(1)
          .build();
    }

    return ReceiverValidationResponseDTO.builder()
        .valid(true)
        .message("Account found")
        .accountNumber(account.getAccountNumber())
        .accountHolderName(account.getCustomer().getFullName())
        .bankName(account.getBank().getBankName())
        .ifscCode(account.getBank().getIfscCode())
        .matchedAccountCount(1)
        .build();
  }

  /**
   * Check if current user has ROLE_ADMIN
   */
  private boolean isAdminUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) {
      return false;
    }
    return auth.getAuthorities().stream()
        .anyMatch(grantedAuth -> "ROLE_ADMIN".equals(grantedAuth.getAuthority()));
  }

  @Override
  @Transactional
  @SuppressWarnings("deprecation")
  public AccountResponseDTO createAccount(String bankName, AccountRequestDTO dto) {
    // Validate input parameters
    validateCreateAccountRequest(bankName, dto);

    // Find the bank
    Bank bank = resolveBank(bankName);

    UserCreationResult userResult = resolveOrCreateUser(dto);

    // Check if user already has an account at any bank (single-bank-per-user
    // constraint)
    if (userResult.user().getId() != null) {
      List<Account> existingAccounts = accountRepository.findByCustomerUserId(
          userResult.user().getId());
      if (!existingAccounts.isEmpty()) {
        throw new InvalidDataException(
            "User already has a bank account. Only one bank account per user is allowed.");
      }
    }
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
          .kycStatus(
              dto.getCustomer().getKycStatus() != null
                  ? dto.getCustomer().getKycStatus()
                  : Status.PENDING)
          .customerStatus(
              dto.getCustomer().getCustomerStatus() != null
                  ? dto.getCustomer().getCustomerStatus()
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
    account.setBalance(BigDecimal.ZERO); // satisfies legacy DB NOT NULL constraint only
    Account savedAccount = accountRepository.save(account);
    if (dto.getInitialDeposit().compareTo(BigDecimal.ZERO) >= 0) {
      ledgerWriter.postCredit(savedAccount.getId(), dto.getInitialDeposit(), "OPENING_BALANCE");
    }

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

    // Update account fields — post a ledger adjustment to keep ledger in sync
    if (dto.getInitialDeposit() != null) {
      if (dto.getInitialDeposit().compareTo(BigDecimal.ZERO) < 0) {
        throw new InvalidDataException(
            "Balance cannot be negative", "balance", dto.getInitialDeposit());
      }
      BigDecimal currentBalance = ledgerRepository.calculateBalance(account.getId());
      BigDecimal adjustment = dto.getInitialDeposit().subtract(currentBalance);
      String refId = "ADMIN_ADJUSTMENT_" + account.getAccountNumber();
      if (adjustment.compareTo(BigDecimal.ZERO) > 0) {
        ledgerWriter.postCredit(account.getId(), adjustment, refId);
      } else if (adjustment.compareTo(BigDecimal.ZERO) < 0) {
        ledgerWriter.postDebit(account.getId(), adjustment.negate(), refId);
      }
    }

    return accountMapper.toResponseDTO(accountRepository.save(account));
  }

  @Override
  @Transactional
  public AccountResponseDTO updateAccountCompliance(
      String accountNumber, AccountComplianceUpdateRequestDTO dto) {
    if (accountNumber == null || accountNumber.isBlank()) {
      throw new InvalidDataException("Account number cannot be null", "accountNumber", null);
    }
    if (dto == null) {
      throw new InvalidDataException(
          "Compliance payload cannot be null", "accountComplianceUpdateRequestDTO", null);
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

  @Override
  @Transactional(readOnly = true)
  public AccountLedgerBalanceDTO getLedgerBalance(String accountNumber) {
    if (!StringUtils.hasText(accountNumber)) {
      throw new InvalidDataException("accountNumber is required", "accountNumber", null);
    }
    Account account = accountRepository.findByAccountNumberWithDetails(accountNumber);
    if (account == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
    }
    Long id = account.getId();
    return AccountLedgerBalanceDTO.builder()
        .accountNumber(account.getAccountNumber())
        .currencyCode(account.getCurrencyCode())
        .bankName(account.getBank() != null ? account.getBank().getBankName() : null)
        .accountStatus(account.getStatus())
        .liveBalance(ledgerRepository.calculateBalance(id))
        .totalReceived(ledgerRepository.calculateReceivedBalance(id))
        .totalSent(ledgerRepository.calculateSentBalance(id))
        .build();
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
      throw new InvalidDataException(
          "Customer email is required", "email", dto.getCustomer().getEmail());
    }
    if (!StringUtils.hasText(dto.getCustomer().getPhoneNumber())) {
      throw new InvalidDataException(
          "Customer phone number is required", "phoneNumber", dto.getCustomer().getPhoneNumber());
    }
    if (!StringUtils.hasText(dto.getCustomer().getFullName())) {
      throw new InvalidDataException(
          "Customer full name is required", "fullName", dto.getCustomer().getFullName());
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
    String username = StringUtils.hasText(requestedUsername)
        ? requestedUsername.trim()
        : dto.getCustomer().getEmail();
    if (!StringUtils.hasText(username)) {
      throw new InvalidDataException(
          "Username or email is required to create linked user", "username", requestedUsername);
    }

    return userRepository
        .findByUsername(username)
        .or(() -> userRepository.findByEmail(dto.getCustomer().getEmail()))
        .map(existing -> new UserCreationResult(existing, null))
        .orElseGet(() -> createUser(dto, username));
  }

  private UserCreationResult createUser(AccountRequestDTO dto, String username) {
    var role = roleRepository
        .findByName(com.bank.entity.Role.RoleName.ROLE_USER)
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

package com.bank.service.auth;

import com.bank.dto.auth.AuthResponseDTO;
import com.bank.dto.auth.ChangePasswordRequestDTO;
import com.bank.dto.auth.ForgotPasswordRequestDTO;
import com.bank.dto.auth.ForgotPasswordResponseDTO;
import com.bank.dto.auth.LoginRequestDTO;
import com.bank.dto.auth.RegisterRequestDTO;
import com.bank.dto.auth.ResetPasswordRequestDTO;
import com.bank.dto.auth.UserResponseDTO;
import com.bank.entity.AccessEventType;
import com.bank.entity.AuditStatus;
import com.bank.entity.Customer;
import com.bank.entity.Role;
import com.bank.entity.Status;
import com.bank.entity.User;
import com.bank.exception.InvalidDataException;
import com.bank.repository.AccessLogRepository;
import com.bank.repository.AccountRepository;
import com.bank.repository.AuditLogRepository;
import com.bank.repository.BankRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.RoleRepository;
import com.bank.repository.TransactionRepository;
import com.bank.repository.UpiRepository;
import com.bank.repository.UserRepository;
import com.bank.repository.UserSessionRepository;
import com.bank.security.JwtUtil;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

  private static final long PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;
  private final CustomerRepository customerRepository;
  private final AccountRepository accountRepository;
  private final TransactionRepository transactionRepository;
  private final UpiRepository upiRepository;
  private final BankRepository bankRepository;
  private final UserSessionRepository userSessionRepository;
  private final AccessLogRepository accessLogRepository;
  private final AuditLogRepository auditLogRepository;
  private final SecureRandom secureRandom = new SecureRandom();

  @Transactional
  public AuthResponseDTO register(RegisterRequestDTO request) {
    // Check if username or email already exists
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new RuntimeException("Username already exists");
    }
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("Email already exists");
    }

    User user = new User();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setFullName(request.getFullName());
    user.setPhoneNumber(request.getPhoneNumber());
    user.setActive(true);
    user.setLocked(false);

    Set<Role> roles = new HashSet<>();
    if (request.getRoles() != null && !request.getRoles().isEmpty()) {
      for (String roleName : request.getRoles()) {
        Role role =
            roleRepository
                .findByName(Role.RoleName.valueOf(roleName))
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        roles.add(role);
      }
    } else {
      Role userRole =
          roleRepository
              .findByName(Role.RoleName.ROLE_USER)
              .orElseThrow(() -> new RuntimeException("Default role not found"));
      roles.add(userRole);
    }

    user.setRoles(roles);
    user = userRepository.save(user);

    String accessToken = jwtUtil.generateToken(user);
    String refreshToken = jwtUtil.generateRefreshToken(user);
    return buildAuthResponse(user, accessToken, refreshToken, false);
  }

  @Transactional
  public AuthResponseDTO login(LoginRequestDTO request) {
    User user =
        userRepository
            .findByUsername(request.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    boolean firstLogin = user.getLastLogin() == null;
    boolean hasPassword = StringUtils.hasText(user.getPassword());
    boolean passwordProvided = StringUtils.hasText(request.getPassword());

    if (!(firstLogin && !passwordProvided)) {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
    }

    boolean passwordChangeRequired = firstLogin;
    if (!firstLogin && hasPassword) {
      user.setLastLogin(LocalDateTime.now());
      userRepository.save(user);
    }

    String accessToken = jwtUtil.generateToken(user);
    String refreshToken = jwtUtil.generateRefreshToken(user);
    return buildAuthResponse(user, accessToken, refreshToken, passwordChangeRequired);
  }

  @Transactional(readOnly = true)
  public UserResponseDTO getCurrentUser(String username) {
    User user =
        userRepository
            .findByUsernameWithRoles(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    return buildUserResponse(user);
  }

  @Transactional
  public void changePassword(String username, ChangePasswordRequestDTO request) {
    if (request == null || !StringUtils.hasText(request.getNewPassword())) {
      throw new InvalidDataException("New password is required", "newPassword", null);
    }
    if (request.getNewPassword().length() < 8) {
      throw new InvalidDataException(
          "New password must be at least 8 characters", "newPassword", null);
    }

    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    boolean hasExistingPassword = StringUtils.hasText(user.getPassword());
    boolean firstLogin = user.getLastLogin() == null || !hasExistingPassword;

    if (hasExistingPassword
        && !firstLogin
        && !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
      throw new InvalidDataException("Current password is incorrect", "currentPassword", null);
    }

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    user.setLastLogin(LocalDateTime.now());
    userRepository.save(user);
  }

  @Transactional
  public ForgotPasswordResponseDTO requestPasswordReset(ForgotPasswordRequestDTO request) {
    if (request == null || !StringUtils.hasText(request.getIdentifier())) {
      throw new InvalidDataException("Username or email is required", "identifier", null);
    }

    String identifier = request.getIdentifier().trim();
    User user = userRepository.findByUsernameOrEmailIgnoreCase(identifier).orElse(null);
    if (user == null) {
      return ForgotPasswordResponseDTO.builder()
          .message("If an account exists, a reset token has been generated.")
          .build();
    }

    String token = generatePasswordResetToken();
    LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(PASSWORD_RESET_TOKEN_TTL_MINUTES);
    user.setPasswordResetToken(token);
    user.setPasswordResetTokenExpiresAt(expiresAt);
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);

    return ForgotPasswordResponseDTO.builder()
        .message("Reset token generated successfully.")
        .resetToken(token)
        .expiresAt(expiresAt)
        .build();
  }

  @Transactional
  public String resetPassword(ResetPasswordRequestDTO request) {
    if (request == null || !StringUtils.hasText(request.getToken())) {
      throw new InvalidDataException("Reset token is required", "token", null);
    }
    if (!StringUtils.hasText(request.getNewPassword())) {
      throw new InvalidDataException("New password is required", "newPassword", null);
    }
    if (request.getNewPassword().length() < 8) {
      throw new InvalidDataException(
          "New password must be at least 8 characters", "newPassword", null);
    }

    String token = request.getToken().trim();
    User user =
        userRepository
            .findByPasswordResetToken(token)
            .orElseThrow(
                () -> new InvalidDataException("Invalid or expired reset token", "token", token));

    LocalDateTime now = LocalDateTime.now();
    if (user.getPasswordResetTokenExpiresAt() == null
        || user.getPasswordResetTokenExpiresAt().isBefore(now)) {
      user.setPasswordResetToken(null);
      user.setPasswordResetTokenExpiresAt(null);
      user.setUpdatedAt(now);
      userRepository.save(user);
      throw new InvalidDataException("Reset token has expired. Request a new one.", "token", token);
    }

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    user.setPasswordResetToken(null);
    user.setPasswordResetTokenExpiresAt(null);
    user.setUpdatedAt(now);
    user.setLastLogin(now);
    userRepository.save(user);
    return user.getUsername();
  }

  private AuthResponseDTO buildAuthResponse(
      User user, String accessToken, String refreshToken, boolean passwordChangeRequired) {
    return AuthResponseDTO.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .tokenType("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .phoneNumber(user.getPhoneNumber())
        .avatarUrl(user.getAvatarUrl())
        .roles(
            user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet()))
        .expiresAt(LocalDateTime.now().plusHours(24))
        .passwordChangeRequired(passwordChangeRequired)
        .build();
  }

  private UserResponseDTO buildUserResponse(User user) {
    UserResponseDTO.UserResponseDTOBuilder builder =
      UserResponseDTO.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .avatarUrl(user.getAvatarUrl())
            .primaryRole(resolvePrimaryRole(user))
            .roles(
                user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet()))
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .lastLogin(user.getLastLogin());

    if (hasRole(user, Role.RoleName.ROLE_ADMIN)) {
      builder.isActive(user.isActive()).isLocked(user.isLocked());
    }

    Customer customer = customerRepository.findByUserId(user.getId());
    if (customer != null) {
      builder
          .customerId(customer.getId())
          .customerStatus(
              customer.getCustomerStatus() != null ? customer.getCustomerStatus().name() : null)
          .kycStatus(customer.getKycStatus() != null ? customer.getKycStatus().name() : null)
          .age(customer.getAge())
          .address(customer.getAddress());
    }

    applyPersonalBankingMetrics(builder, user, customer);
    applyManagedScopeMetrics(builder, user);
    applyComplianceMetrics(builder, user);
    return builder.build();
  }

  private void applyPersonalBankingMetrics(
      UserResponseDTO.UserResponseDTOBuilder builder, User user, Customer customer) {
    List<com.bank.entity.Account> ownAccounts =
        accountRepository.findByCustomerUserId(user.getId());
    BigDecimal totalBalance =
        ownAccounts.stream()
            .map(com.bank.entity.Account::getBalance)
            .filter(balance -> balance != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    long upiProfileCount =
        ownAccounts.stream()
            .map(com.bank.entity.Account::getAccountNumber)
            .filter(StringUtils::hasText)
            .mapToLong(upiRepository::countByLinkedAccountAccountNumber)
            .sum();

    long transactionCount = 0L;
    if (customer != null && StringUtils.hasText(customer.getEmail())) {
      Set<Long> txnIds = new HashSet<>();
      ownAccounts.stream()
          .map(com.bank.entity.Account::getAccountNumber)
          .filter(StringUtils::hasText)
          .forEach(
              accountNumber ->
                  transactionRepository
                      .findTransactionByAccountNumberAndEmail(accountNumber, customer.getEmail())
                      .forEach(
                          tx -> {
                            if (tx.getTransactionId() != null) {
                              txnIds.add(tx.getTransactionId());
                            }
                          }));
      transactionCount = txnIds.size();
    }

    builder
        .accountCount((long) ownAccounts.size())
        .totalBalance(totalBalance)
        .upiProfileCount(upiProfileCount)
        .transactionCount(transactionCount);
  }

  private void applyManagedScopeMetrics(UserResponseDTO.UserResponseDTOBuilder builder, User user) {
    boolean canViewManagedScope =
        hasRole(user, Role.RoleName.ROLE_ADMIN)
            || hasRole(user, Role.RoleName.ROLE_MANAGER)
            || hasRole(user, Role.RoleName.ROLE_CUSTOMER_MANAGER)
            || hasRole(user, Role.RoleName.ROLE_AUDITOR);
    if (canViewManagedScope) {
      builder
          .managedBankCount(bankRepository.count())
          .managedCustomerCount(customerRepository.count())
          .managedAccountCount(accountRepository.count())
          .pendingKycCount(countPendingKyc());
    }

    boolean canViewManagedTransactions =
        hasRole(user, Role.RoleName.ROLE_ADMIN)
            || hasRole(user, Role.RoleName.ROLE_MANAGER)
            || hasRole(user, Role.RoleName.ROLE_AUDITOR);
    if (canViewManagedTransactions) {
      builder
          .managedTransactionCount(transactionRepository.count())
          .managedUpiProfileCount(upiRepository.count());
    }
  }

  private void applyComplianceMetrics(UserResponseDTO.UserResponseDTOBuilder builder, User user) {
    if (hasRole(user, Role.RoleName.ROLE_ADMIN)) {
      builder
          .activeSessionCount(userSessionRepository.countByActiveTrue())
          .failedLoginCount(accessLogRepository.countByEventType(AccessEventType.FAILED_LOGIN));
    }
    if (hasRole(user, Role.RoleName.ROLE_ADMIN) || hasRole(user, Role.RoleName.ROLE_AUDITOR)) {
      builder
          .auditSuccessCount(auditLogRepository.countByStatus(AuditStatus.SUCCESS))
          .auditFailureCount(auditLogRepository.countByStatus(AuditStatus.FAILED));
    }
  }

  private long countPendingKyc() {
    return customerRepository.findAll().stream()
        .filter(
            customer ->
                customer.getKycStatus() != Status.COMPLETED
                    && customer.getKycStatus() != Status.SUCCESS)
        .count();
  }

  private String resolvePrimaryRole(User user) {
    if (hasRole(user, Role.RoleName.ROLE_ADMIN)) {
      return Role.RoleName.ROLE_ADMIN.name();
    }
    if (hasRole(user, Role.RoleName.ROLE_MANAGER)) {
      return Role.RoleName.ROLE_MANAGER.name();
    }
    if (hasRole(user, Role.RoleName.ROLE_CUSTOMER_MANAGER)) {
      return Role.RoleName.ROLE_CUSTOMER_MANAGER.name();
    }
    if (hasRole(user, Role.RoleName.ROLE_AUDITOR)) {
      return Role.RoleName.ROLE_AUDITOR.name();
    }
    if (hasRole(user, Role.RoleName.ROLE_USER)) {
      return Role.RoleName.ROLE_USER.name();
    }
    return user.getRoles().stream().findFirst().map(role -> role.getName().name()).orElse(null);
  }

  private boolean hasRole(User user, Role.RoleName roleName) {
    if (user.getRoles() == null || user.getRoles().isEmpty()) {
      return false;
    }
    return user.getRoles().stream().anyMatch(role -> role.getName() == roleName);
  }

  private String generatePasswordResetToken() {
    byte[] bytes = new byte[32];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}

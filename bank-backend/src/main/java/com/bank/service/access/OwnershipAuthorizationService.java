package com.bank.service.access;

import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Role;
import com.bank.entity.User;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.UserRepository;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OwnershipAuthorizationService {
  private final UserRepository userRepository;
  private final AccountRepository accountRepository;
  private final CustomerRepository customerRepository;

  public User requireCurrentUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new AccessDeniedException("Authentication required");
    }
    String identifier = auth.getName();
    return userRepository
        .findByUsernameOrEmailIgnoreCase(identifier)
        .orElseThrow(() -> new AccessDeniedException("User not found"));
  }

  public void assertAccountAccess(Account account) {
    if (account == null) {
      throw new ResourceNotFoundException("Account", "id", "null");
    }

    User user = requireCurrentUser();
    if (hasPrivilegedAccess(user)) {
      return;
    }
    if (!hasRole(user, Role.RoleName.ROLE_USER) || !ownsAccount(user, account)) {
      throw new AccessDeniedException("You can only access your own accounts");
    }
  }

  public void assertAccountAccessById(Long accountId) {
    Account account = accountRepository.findById(accountId)
        .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));
    assertAccountAccess(account);
  }

  public void assertAccountAccessByNumber(String accountNumber) {
    Account account = accountRepository.findByAccountNumber(accountNumber);
    if (account == null) {
      throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
    }
    assertAccountAccess(account);
  }

  public void assertAnyAccountAccess(Account... accounts) {
    User user = requireCurrentUser();
    if (hasPrivilegedAccess(user)) {
      return;
    }
    if (hasRole(user, Role.RoleName.ROLE_USER)
        && accounts != null
        && Arrays.stream(accounts)
            .filter(account -> account != null)
            .anyMatch(account -> ownsAccount(user, account))) {
      return;
    }
    throw new AccessDeniedException("You can only access transactions involving your own accounts");
  }

  public void assertCustomerAccess(Customer customer) {
    if (customer == null) {
      throw new ResourceNotFoundException("Customer", "id", "null");
    }

    User user = requireCurrentUser();
    if (hasPrivilegedAccess(user)) {
      return;
    }
    Long ownerId = customer.getUser() != null ? customer.getUser().getId() : null;
    if (!hasRole(user, Role.RoleName.ROLE_USER) || !user.getId().equals(ownerId)) {
      throw new AccessDeniedException("You can only access your own customer records");
    }
  }

  public void assertCustomerAccessById(String customerId) {
    Customer customer = customerRepository.findById(customerId)
        .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
    assertCustomerAccess(customer);
  }

  private boolean ownsAccount(User user, Account account) {
    Long ownerId = account.getCustomer() != null && account.getCustomer().getUser() != null
        ? account.getCustomer().getUser().getId()
        : null;
    return user.getId().equals(ownerId);
  }

  private boolean hasPrivilegedAccess(User user) {
    return hasRole(user, Role.RoleName.ROLE_ADMIN)
        || hasRole(user, Role.RoleName.ROLE_MANAGER)
        || hasRole(user, Role.RoleName.ROLE_CUSTOMER_MANAGER)
        || hasRole(user, Role.RoleName.ROLE_AUDITOR);
  }

  public boolean hasRole(User user, Role.RoleName role) {
    if (user == null || user.getRoles() == null) {
      return false;
    }
    return user.getRoles().stream().anyMatch(r -> r.getName() == role);
  }
}

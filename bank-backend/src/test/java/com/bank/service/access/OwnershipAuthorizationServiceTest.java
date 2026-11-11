package com.bank.service.access;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Role;
import com.bank.entity.User;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.UserRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class OwnershipAuthorizationServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private AccountRepository accountRepository;
  @Mock private CustomerRepository customerRepository;
  @InjectMocks private OwnershipAuthorizationService ownershipAuthorizationService;

  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void customerCanAccessTheirOwnAccountAndCustomerRecord() {
    User currentUser = user(14L, "customer", Role.RoleName.ROLE_USER);
    authenticateAs("customer", currentUser);
    Account account = accountOwnedBy(currentUser);
    Customer customer = account.getCustomer();

    assertThatNoException()
        .isThrownBy(() -> ownershipAuthorizationService.assertAccountAccess(account));
    assertThatNoException()
        .isThrownBy(() -> ownershipAuthorizationService.assertCustomerAccess(customer));
  }

  @Test
  void customerCannotAccessAnotherUsersAccountOrCustomerRecord() {
    User currentUser = user(14L, "customer", Role.RoleName.ROLE_USER);
    User anotherUser = user(15L, "another", Role.RoleName.ROLE_USER);
    authenticateAs("customer", currentUser);
    Account foreignAccount = accountOwnedBy(anotherUser);

    assertThatThrownBy(() -> ownershipAuthorizationService.assertAccountAccess(foreignAccount))
        .isInstanceOf(AccessDeniedException.class);
    assertThatThrownBy(
            () -> ownershipAuthorizationService.assertCustomerAccess(foreignAccount.getCustomer()))
        .isInstanceOf(AccessDeniedException.class);
  }

  @Test
  void administratorsCanAccessOtherCustomersAccounts() {
    User administrator = user(1L, "admin", Role.RoleName.ROLE_ADMIN);
    User customer = user(14L, "customer", Role.RoleName.ROLE_USER);
    authenticateAs("admin", administrator);

    assertThatNoException()
        .isThrownBy(
            () -> ownershipAuthorizationService.assertAccountAccess(accountOwnedBy(customer)));
  }

  private void authenticateAs(String username, User user) {
    when(userRepository.findByUsernameOrEmailIgnoreCase(username)).thenReturn(Optional.of(user));
    SecurityContextHolder.getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(username, "test", user.getAuthorities()));
  }

  private static User user(Long id, String username, Role.RoleName roleName) {
    User user = new User();
    user.setId(id);
    user.setUsername(username);
    Role role = new Role();
    role.setName(roleName);
    user.setRoles(Set.of(role));
    return user;
  }

  private static Account accountOwnedBy(User user) {
    Customer customer = new Customer();
    customer.setUser(user);
    Account account = new Account();
    account.setCustomer(customer);
    return account;
  }
}

package com.bank.service.card;

import com.bank.entity.Account;
import com.bank.entity.Role;
import com.bank.entity.User;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CardAccessService {
  private final UserRepository userRepository;

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
    boolean isAdmin = hasRole(user, Role.RoleName.ROLE_ADMIN);
    boolean isPrivileged = hasRole(user, Role.RoleName.ROLE_MANAGER)
        || hasRole(user, Role.RoleName.ROLE_CUSTOMER_MANAGER)
        || hasRole(user, Role.RoleName.ROLE_AUDITOR);

    if (!isAdmin && !isPrivileged && hasRole(user, Role.RoleName.ROLE_USER)) {
      Long ownerId = account.getCustomer() != null && account.getCustomer().getUser() != null
          ? account.getCustomer().getUser().getId()
          : null;
      if (ownerId == null || !ownerId.equals(user.getId())) {
        throw new AccessDeniedException("You can only manage your own cards");
      }
    }
  }

  public boolean hasRole(User user, Role.RoleName role) {
    if (user == null || user.getRoles() == null) {
      return false;
    }
    return user.getRoles().stream().anyMatch(r -> r.getName() == role);
  }
}

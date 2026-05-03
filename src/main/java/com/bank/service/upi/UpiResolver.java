package com.bank.service.upi;

import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Status;
import com.bank.entity.UpiProfile;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.UpiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class UpiResolver {

  private final UpiRepository upiRepository;

  @Transactional(readOnly = true)
  public Account resolveActiveAccount(String upiId) {
    if (upiId == null || upiId.isBlank()) {
      throw new InvalidDataException("UPI ID is required");
    }

    UpiProfile upiProfile =
        upiRepository
            .findByUpiIdAndStatus(upiId, Status.ACTIVE)
            .orElseThrow(() -> new ResourceNotFoundException("UPI Profile", "upiId", upiId));
    return upiProfile.getLinkedAccount();
  }

  @Transactional(readOnly = true)
  public Account resolveAndVerifyOwnership(String upiId, String username) {
    if (username == null || username.isBlank()) {
      throw new AccessDeniedException(
          "Authenticated username is required for ownership verification");
    }

    Account account = resolveActiveAccount(upiId);
    Customer customer = account.getCustomer();
    if (customer == null) {
      throw new IllegalStateException(
          "Account has no associated customer: " + account.getAccountNumber());
    }

    // Modern / secure path
    if (customer.getUser() != null) {
      String accountOwnerUsername = customer.getUser().getUsername();
      if (accountOwnerUsername == null || !accountOwnerUsername.equals(username)) {
        throw new AccessDeniedException(
            "Authenticated user '"
                + username
                + "' does not own UPI ID '"
                + upiId
                + "'. UPI belongs to user: "
                + accountOwnerUsername);
      }
      return account;
    }

    // Legacy fallback (consider removing after data migration)
    throw new AccessDeniedException(
        "UPI ownership cannot be verified: Customer has no linked User account. UPI ID: "
            + upiId
            + " | Contact support or migrate account linkage.");

    /*
    // fallback temporarily
    String customerName = customer.getFullName();
    String customerEmail = customer.getEmail();
    boolean matches = customerName != null && customerName.equalsIgnoreCase(username)
    		|| customerEmail != null
    				&& (customerEmail.equalsIgnoreCase(username)
    						|| customerEmail.split("@")[0].equalsIgnoreCase(username));
    if (!matches) {
    	throw new AccessDeniedException(
    			"Authenticated user '"
    					+ username
    					+ "' does not own UPI ID '"
    					+ upiId
    					+ "'. Possible owner: "
    					+ customerName
    					+ " ("
    					+ customerEmail
    					+ ")");
    }
    // Log warning so you can track how often fallback is used
    // log.warn("Using legacy UPI ownership fallback for username: {}", username);
    return account;
    */
  }
}

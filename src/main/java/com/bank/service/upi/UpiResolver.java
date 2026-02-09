package com.bank.service.upi;

import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Status;
import com.bank.entity.UpiProfile;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.UpiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class UpiResolver {
    private final UpiRepository upiRepository;

    @Transactional(readOnly = true)
    public Account resolveActiveAccount(String upiId) {
        if (upiId == null || upiId.isBlank()) {
            throw new InvalidDataException("please enter upiId of account");
        }
        UpiProfile upiProfile = upiRepository.findByUpiIdAndStatus(upiId, Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("UpiProfile", "upiId", upiId));
        return upiProfile.getLinkedAccount();
    }

    @Transactional(readOnly = true)
    public Account resolveAndVerifyOwnership(String upiId, String username) {
        Account account = resolveActiveAccount(upiId);

        Customer customer = account.getCustomer();

        // Primary validation: Check if customer has linked User account
        if (customer.getUser() != null) {
            String accountOwnerUsername = customer.getUser().getUsername();
            if (!accountOwnerUsername.equals(username)) {
                throw new SecurityException("User '" + username + "' does not own UPI account '" + upiId + "'. " +
                        "Account belongs to user: " + accountOwnerUsername);
            }
        } else {
            // Fallback validation for customers without linked User (backward
            // compatibility)
            String customerName = customer.getFullName();
            String customerEmail = customer.getEmail();

            boolean isOwner = customerName.equalsIgnoreCase(username) ||
                    customerEmail.equalsIgnoreCase(username) ||
                    customerEmail.split("@")[0].equalsIgnoreCase(username);

            if (!isOwner) {
                throw new SecurityException("User '" + username + "' does not own UPI account '" + upiId + "'. " +
                        "Account belongs to customer: " + customerName + " (" + customerEmail + ")");
            }
        }

        return account;
    }
}

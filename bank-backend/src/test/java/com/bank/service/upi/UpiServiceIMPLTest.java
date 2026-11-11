package com.bank.service.upi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bank.entity.Account;
import com.bank.entity.Role;
import com.bank.entity.Status;
import com.bank.entity.UpiProfile;
import com.bank.entity.User;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.TransactionRepository;
import com.bank.repository.UpiPaymentObjRepository;
import com.bank.repository.UpiRepository;
import com.bank.service.access.OwnershipAuthorizationService;
import com.bank.service.transaction.TransactionService;
import com.bank.service.transaction.mapper.TransactionMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class UpiServiceIMPLTest {

  @Mock private UpiRepository upiRepository;
  @Mock private UpiPaymentObjRepository upiPaymentObjRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private TransactionMapper transactionMapper;
  @Mock private TransactionService transactionService;
  @Mock private UpiResolver upiResolver;
  @Mock private AccountRepository accountRepository;
  @Mock private CustomerRepository customerRepository;
  @Mock private OwnershipAuthorizationService ownershipAuthorizationService;

  @InjectMocks private UpiServiceIMPL upiService;

  @Test
  void getUpiProfileChecksLinkedAccountOwnership() {
    Account account = new Account();
    UpiProfile profile = UpiProfile.builder()
        .upiId("customer@bank")
        .linkedAccount(account)
        .status(Status.ACTIVE)
        .build();
    when(upiRepository.findByUpiIdAndStatusWithDetails("customer@bank", Status.ACTIVE))
        .thenReturn(Optional.of(profile));
    doThrow(new AccessDeniedException("Not the account owner"))
        .when(ownershipAuthorizationService)
        .assertAccountAccess(account);

    assertThatThrownBy(() -> upiService.getUpiProfile("customer@bank"))
        .isInstanceOf(AccessDeniedException.class);
    verify(ownershipAuthorizationService).assertAccountAccess(account);
  }

  @Test
  void getUpiProfilesByAccountNumberChecksOwnershipBeforeReadingProfiles() {
    Account account = new Account();
    when(accountRepository.findByAccountNumber("account-123")).thenReturn(account);
    doThrow(new AccessDeniedException("Not the account owner"))
        .when(ownershipAuthorizationService)
        .assertAccountAccess(account);

    assertThatThrownBy(() -> upiService.getUpiProfilesByAccountNumber("account-123"))
        .isInstanceOf(AccessDeniedException.class);
    verify(upiRepository, never())
        .findByLinkedAccountAccountNumberAndBankNameWithDetails("account-123", null);
  }

  @Test
  void managerCanReadSystemWideUpiProfiles() {
    User manager = new User();
    manager.setId(8L);
    when(ownershipAuthorizationService.requireCurrentUser()).thenReturn(manager);
    when(ownershipAuthorizationService.hasRole(manager, Role.RoleName.ROLE_ADMIN)).thenReturn(false);
    when(ownershipAuthorizationService.hasRole(manager, Role.RoleName.ROLE_MANAGER)).thenReturn(true);
    when(upiRepository.findAllWithDetails()).thenReturn(List.of());

    assertThat(upiService.getAllUpiProfiles()).isEmpty();
    verify(upiRepository).findAllWithDetails();
  }

  @Test
  void missingAccountIsNotFoundBeforeProfileLookup() {
    when(accountRepository.findByAccountNumber("missing")).thenReturn(null);

    assertThatThrownBy(() -> upiService.getUpiProfilesByAccountNumber("missing"))
        .isInstanceOf(ResourceNotFoundException.class);
    verify(ownershipAuthorizationService, never()).assertAccountAccess(org.mockito.ArgumentMatchers.any());
  }
}

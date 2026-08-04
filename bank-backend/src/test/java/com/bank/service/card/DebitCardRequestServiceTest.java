package com.bank.service.card;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bank.dto.card.DebitCardRequestCreateRequest;
import com.bank.dto.card.DebitCardRequestDTO;
import com.bank.entity.Account;
import com.bank.entity.Bank;
import com.bank.entity.Customer;
import com.bank.entity.Status;
import com.bank.entity.User;
import com.bank.repository.AccountRepository;
import com.bank.repository.DebitCardRequestRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DebitCardRequestServiceTest {

  @Mock
  private DebitCardRequestRepository debitCardRequestRepository;

  @Mock
  private AccountRepository accountRepository;

  @Mock
  private DebitCardService debitCardService;

  @Mock
  private CardAccessService cardAccessService;

  @InjectMocks
  private DebitCardRequestService debitCardRequestService;

  @Test
  void createRequest_acceptsActiveKycAndPersistsTheRequest() {
    Account account = buildAccount(12L, "ACC-123", Status.ACTIVE, Status.ACTIVE, "alice");
    User requester = buildUser(77L, "alice", "Alice Example");

    DebitCardRequestCreateRequest request = DebitCardRequestCreateRequest.builder()
        .accountNumber("ACC-123")
        .cardType("VISA")
        .isVirtual(false)
        .dailyLimit(new BigDecimal("5000"))
        .monthlyLimit(new BigDecimal("50000"))
        .otpRequired(true)
        .isContactlessEnabled(true)
        .isInternationalEnabled(false)
        .deliveryMethod("STANDARD")
        .deliveryAddress("221B Baker Street")
        .build();

    when(accountRepository.findByAccountNumberWithDetails("ACC-123")).thenReturn(account);
    doNothing().when(cardAccessService).assertAccountAccess(account);
    when(cardAccessService.requireCurrentUser()).thenReturn(requester);
    when(debitCardRequestRepository.save(any())).thenAnswer(invocation -> {
      com.bank.entity.DebitCardRequest saved = invocation.getArgument(0);
      saved.setId(99L);
      return saved;
    });

    DebitCardRequestDTO response = debitCardRequestService.createRequest(request);

    assertThat(response.getId()).isEqualTo(99L);
    assertThat(response.getAccountId()).isEqualTo(12L);
    assertThat(response.getAccountNumber()).isEqualTo("ACC-123");
    assertThat(response.getRequestedByUserId()).isEqualTo(77L);
    assertThat(response.getRequestedByName()).isEqualTo("Alice Example");
    assertThat(response.getStatus()).isEqualTo("PENDING");
    assertThat(response.getKycStatusAtRequest()).isEqualTo("ACTIVE");
    assertThat(response.getDeliveryStatus()).isEqualTo("PENDING");

    verify(debitCardRequestRepository).save(any());
  }

  private static Account buildAccount(Long id, String accountNumber, Status accountStatus,
      Status kycStatus, String username) {
    Bank bank = Bank.builder()
        .id("BANK-1")
        .bankName("Demo Bank")
        .branch("Main")
        .ifscCode("DEMO0001")
        .city("Pune")
        .state("MH")
        .build();

    User user = buildUser(55L, username, "Alice Example");

    Customer customer = Customer.builder()
        .id("CUST-1")
        .fullName("Alice Example")
        .email("alice@example.com")
        .phoneNumber("9999999999")
        .kycStatus(kycStatus)
        .customerStatus(Status.ACTIVE)
        .user(user)
        .build();

    return Account.builder()
        .id(id)
        .accountNumber(accountNumber)
        .status(accountStatus)
        .bank(bank)
        .customer(customer)
        .balance(BigDecimal.ZERO)
        .build();
  }

  private static User buildUser(Long id, String username, String fullName) {
    User user = new User();
    user.setId(id);
    user.setUsername(username);
    user.setFullName(fullName);
    user.setEmail(username + "@example.com");
    user.setPassword("secret");
    return user;
  }
}
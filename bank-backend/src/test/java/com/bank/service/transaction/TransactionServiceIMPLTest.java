package com.bank.service.transaction;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.entity.Account;
import com.bank.entity.Bank;
import com.bank.entity.Customer;
import com.bank.entity.Status;
import com.bank.entity.User;
import com.bank.exception.InvalidDataException;
import com.bank.ledger.LedgerWriter;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.LedgerRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.transaction.mapper.TransactionMapper;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class TransactionServiceIMPLTest {

  @Mock
  private TransactionRepository transactionRepository;

  @Mock
  private TransactionMapper transactionMapper;

  @Mock
  private AccountRepository accountRepository;

  @Mock
  private LedgerWriter ledgerWriter;

  @Mock
  private LedgerRepository ledgerRepository;

  @Mock
  private CustomerRepository customerRepository;

  @Mock
  private ApplicationEventPublisher eventPublisher;

  @InjectMocks
  private TransactionServiceIMPL transactionService;

  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void makeTransaction_rejectsWhenSenderIsNotKycVerified() {
    Account sender = buildAccount(1L, "ACC-001", Status.ACTIVE, Status.PENDING, "alice");
    Account receiver = buildAccount(2L, "ACC-002", Status.ACTIVE, Status.ACTIVE, "bob");
    setAuthentication("alice");

    TransactionRequestDTO request = buildRequest("ACC-001", "ACC-002");
    when(accountRepository.findByAccountNumber("ACC-001")).thenReturn(sender);
    when(accountRepository.findByAccountNumber("ACC-002")).thenReturn(receiver);
    when(accountRepository.lockById(1L)).thenReturn(java.util.Optional.of(sender));
    when(accountRepository.lockById(2L)).thenReturn(java.util.Optional.of(receiver));

    assertThatThrownBy(() -> transactionService.makeTransaction(request))
        .isInstanceOf(InvalidDataException.class)
        .hasMessageContaining("Sender account is not KYC verified");
  }

  @Test
  void makeTransaction_rejectsWhenReceiverIsNotKycVerified() {
    Account sender = buildAccount(1L, "ACC-001", Status.ACTIVE, Status.ACTIVE, "alice");
    Account receiver = buildAccount(2L, "ACC-002", Status.ACTIVE, Status.PENDING, "bob");
    setAuthentication("alice");

    TransactionRequestDTO request = buildRequest("ACC-001", "ACC-002");
    when(accountRepository.findByAccountNumber("ACC-001")).thenReturn(sender);
    when(accountRepository.findByAccountNumber("ACC-002")).thenReturn(receiver);
    when(accountRepository.lockById(1L)).thenReturn(java.util.Optional.of(sender));
    when(accountRepository.lockById(2L)).thenReturn(java.util.Optional.of(receiver));

    assertThatThrownBy(() -> transactionService.makeTransaction(request))
        .isInstanceOf(InvalidDataException.class)
        .hasMessageContaining("Receiver account is not KYC verified");
  }

  private static TransactionRequestDTO buildRequest(String senderAccount, String receiverAccount) {
    TransactionRequestDTO request = new TransactionRequestDTO();
    request.setSenderAccount(senderAccount);
    request.setReceiverAccount(receiverAccount);
    request.setAmount(new BigDecimal("250.00"));
    return request;
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

    User user = buildUser(id + 100, username, username.substring(0, 1).toUpperCase() + username.substring(1));

    Customer customer = Customer.builder()
        .id("CUST-" + id)
        .fullName(user.getFullName())
        .email(username + "@example.com")
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

  private static void setAuthentication(String principal) {
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(
            principal,
            "password",
            List.of(new SimpleGrantedAuthority("ROLE_USER"))));
  }
}
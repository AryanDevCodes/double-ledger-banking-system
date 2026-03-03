package com.bank.service.upi;

import com.bank.dto.transaction.TransactionRequestDTO;
import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Account;
import com.bank.entity.Status;
import com.bank.entity.UpiPaymentOBJ;
import com.bank.entity.UpiProfile;
import com.bank.exception.GlobalServiceException;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.TransactionRepository;
import com.bank.repository.UpiPaymentObjRepository;
import com.bank.repository.UpiRepository;
import com.bank.service.dto.upi.UpiPayRequestDTO;
import com.bank.service.dto.upi.UpiProfileResponseDTO;
import com.bank.service.dto.upi.UpiRegisterRequestDTO;
import com.bank.service.transaction.TransactionService;
import com.bank.service.transaction.mapper.TransactionMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UpiServiceIMPL implements UpiService {
    private final UpiRepository upiRepository;
    private final UpiPaymentObjRepository upiPaymentObjRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final TransactionService transactionService;
    private final UpiResolver upiResolver;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;

    @Override
    @Transactional
    public void registerUpi(Account account, String request) {
        String upiId = request.toLowerCase() + "@mybank";
        if (upiRepository.existsByUpiId(upiId)) {
            throw new InvalidDataException("UPI Id already exist");
        }
        enforceUpiLimit(account.getAccountNumber());
        UpiProfile upiProfile = UpiProfile.builder()
                .upiId(upiId)
                .linkedAccount(account)
                .status(Status.ACTIVE)
                .build();
        upiRepository.save(upiProfile);
    }

    @Override
    @Transactional
    public TransactionResponseDTO executeUpiPayment(UpiPayRequestDTO dto) {

        validateUpiRequest(dto);

        UpiPaymentOBJ obj = upiPaymentObjRepository.findByIdempotencyKey(dto.getIdempotencyKey())
                .orElseGet(() -> createObj(dto));

        if (obj.getStatus() == Status.COMPLETED) {
            return transactionRepository
                    .findTransactionByTransactionId(obj.getTransactionId())
                    .map(transactionMapper::toResponseDTO)
                    .orElseThrow(() -> new GlobalServiceException("Transaction not found for completed payment"));
        }

        if (obj.getStatus() == Status.FAILED) {
            throw new GlobalServiceException("Previous payment attempt failed: " + obj.getFailureReason());
        }

        // IMPROVEMENT: Persist PROCESSING state BEFORE transaction execution
        // This prevents concurrent threads from processing the same intent
        if (obj.getStatus() == Status.INITIATED) {
            obj.setStatus(Status.PROCESSING);
            obj = upiPaymentObjRepository.save(obj); // Persist immediately for iron-clad idempotency
        }

        // SECURITY: Ownership validation implemented
        // Get current authenticated user from security context
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        // Verify sender owns the UPI account (throws SecurityException if not)
        Account sender = upiResolver.resolveAndVerifyOwnership(obj.getFromUpi(), currentUsername);
        Account receiver = upiResolver.resolveActiveAccount(obj.getToUpi());

        TransactionResponseDTO response;

        try {
            // Create transaction request with account numbers
            TransactionRequestDTO transactionRequest = new TransactionRequestDTO();
            transactionRequest.setSenderAccount(sender.getAccountNumber());
            transactionRequest.setReceiverAccount(receiver.getAccountNumber());
            transactionRequest.setAmount(obj.getAmount());

            response = transactionService.makeTransaction(transactionRequest);

            obj.setStatus(Status.COMPLETED);
            obj.setTransactionId(response.getTransactionId());
            obj.setFailureReason(null); // Clear any previous failure reason
            upiPaymentObjRepository.save(obj);

        } catch (Exception ex) {
            obj.setStatus(Status.FAILED);
            obj.setFailureReason(ex.getMessage()); // 🟡 Store failure reason for debugging and UI feedback
            upiPaymentObjRepository.save(obj);
            throw ex;
        }

        return response;
    }

    private UpiPaymentOBJ createObj(UpiPayRequestDTO dto) {

        UpiPaymentOBJ obj = new UpiPaymentOBJ();
        obj.setIdempotencyKey(dto.getIdempotencyKey());
        obj.setFromUpi(dto.getFromUpi());
        obj.setToUpi(dto.getToUpi());
        obj.setAmount(dto.getAmount());
        obj.setStatus(Status.INITIATED);
        obj.setCreatedAt(LocalDateTime.now());

        try {
            return upiPaymentObjRepository.save(obj);
        } catch (DataIntegrityViolationException ex) {
            // Another thread created the same obj concurrently
            return upiPaymentObjRepository.findByIdempotencyKey(dto.getIdempotencyKey())
                    .orElseThrow(() -> new IllegalStateException("obj creation race condition"));
        }
    }

    private void validateUpiRequest(UpiPayRequestDTO dto) {
        if (dto.getAmount() == null || dto.getAmount().signum() <= 0) {
            throw new InvalidDataException("Invalid amount");
        }
        if (dto.getFromUpi().equalsIgnoreCase(dto.getToUpi())) {
            throw new InvalidDataException("Sender and receiver UPI cannot be same");
        }
    }

    @Override
    @Transactional
    public UpiProfileResponseDTO registerUpiProfile(UpiRegisterRequestDTO dto) {
        if (dto.getUpiId() == null || dto.getUpiId().isBlank()) {
            throw new InvalidDataException("UPI ID cannot be blank");
        }

        if (dto.getAccountNumber() == null || dto.getAccountNumber().isBlank()) {
            throw new InvalidDataException("Account number cannot be blank");
        }

        if (upiRepository.existsByUpiId(dto.getUpiId())) {
            throw new InvalidDataException("UPI ID already exists: " + dto.getUpiId());
        }

        Account account = accountRepository.findByAccountNumber(dto.getAccountNumber());
        if (account == null) {
            throw new ResourceNotFoundException("Account", "accountNumber", dto.getAccountNumber());
        }

        enforceUpiLimit(account.getAccountNumber());

        UpiProfile upiProfile = UpiProfile.builder()
                .upiId(dto.getUpiId())
                .linkedAccount(account)
                .status(Status.ACTIVE)
                .build();

        UpiProfile savedProfile = upiRepository.save(upiProfile);

        return mapToResponseDTO(savedProfile);
    }

    @Override
    @Transactional
    public UpiProfileResponseDTO getUpiProfile(String upiId) {
        UpiProfile upiProfile = upiRepository.findByUpiIdAndStatus(upiId, Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("UPI Profile", "upiId", upiId));

        return mapToResponseDTO(upiProfile);
    }

    @Override
    @Transactional
    public List<UpiProfileResponseDTO> getAllUpiProfiles() {
        List<UpiProfile> profiles = upiRepository.findAll();
        return profiles.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<UpiProfileResponseDTO> getUpiProfilesByAccountNumber(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber);
        if (account == null) {
            throw new ResourceNotFoundException("Account", "accountNumber", accountNumber);
        }

        List<UpiProfile> profiles = upiRepository.findAll().stream()
                .filter(profile -> profile.getLinkedAccount().getAccountNumber().equals(accountNumber))
                .toList();

        return profiles.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<UpiProfileResponseDTO> getUpiProfilesForUser(Long userId) {
        if (userId == null) {
            throw new InvalidDataException("User ID is required");
        }

        if (customerRepository.findByUserId(userId) == null) {
            throw new ResourceNotFoundException("Customer", "userId", userId.toString());
        }

        List<Account> accounts = accountRepository.findByCustomerUserId(userId);
        if (accounts.isEmpty()) {
            return List.of();
        }

        List<UpiProfile> profiles = accounts.stream()
                .flatMap(acc -> upiRepository.findByLinkedAccountAccountNumber(acc.getAccountNumber()).stream())
                .distinct()
                .toList();

        return profiles.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UpiProfileResponseDTO updateUpiStatus(String upiId, String status) {
        UpiProfile upiProfile = upiRepository.findByUpiId(upiId)
            .orElseThrow(() -> new ResourceNotFoundException("UPI Profile", "upiId", upiId));

        try {
            Status newStatus = Status.valueOf(status.toUpperCase());
            upiProfile.setStatus(newStatus);
            UpiProfile updatedProfile = upiRepository.save(upiProfile);
            return mapToResponseDTO(updatedProfile);
        } catch (IllegalArgumentException e) {
            throw new InvalidDataException("Invalid status: " + status);
        }
    }

    @Override
    @Transactional
    public void deleteUpiProfile(String upiId) {
        UpiProfile upiProfile = upiRepository.findByUpiId(upiId)
                .orElseThrow(() -> new ResourceNotFoundException("UPI Profile", "upiId", upiId));

        upiProfile.setStatus(Status.INACTIVE);
        upiRepository.save(upiProfile);
    }

    private void enforceUpiLimit(String accountNumber) {
        long count = upiRepository.countByLinkedAccountAccountNumber(accountNumber);
        if (count >= 4) {
            throw new InvalidDataException("UPI limit reached for this account (max 4)");
        }
    }

    private UpiProfileResponseDTO mapToResponseDTO(UpiProfile profile) {
        Account account = profile.getLinkedAccount();

        return UpiProfileResponseDTO.builder()
                .id(profile.getId())
                .upiId(profile.getUpiId())
                .accountNumber(account.getAccountNumber())
                .accountHolderName(account.getCustomer().getFullName())
                .bankName(account.getBank().getBankName())
                .status(profile.getStatus())
                .createdAt(profile.getCreatedAt())
                .build();
    }

}

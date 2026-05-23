package com.bank.controller;

import com.bank.dto.loan.LoanDTO;
import com.bank.entity.Account;
import com.bank.entity.Customer;
import com.bank.entity.Loan;
import com.bank.entity.Status;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.LoanRepository;
import com.bank.service.mapper.LoanMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/loans")
@RequiredArgsConstructor
public class LoanController {
        private final LoanRepository loanRepository;
        private final LoanMapper loanMapper;
        private final CustomerRepository customerRepository;
        private final AccountRepository accountRepository;

        @GetMapping("/customer/{customerId}")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
        public ResponseEntity<List<LoanDTO>> getLoansByCustomer(@PathVariable String customerId) {
                List<Loan> loans = loanRepository.findByCustomerId(customerId);
                List<LoanDTO> dtos = loans.stream()
                                .map(loanMapper::toDTO)
                                .toList();
                return ResponseEntity.ok(dtos);
        }

        @GetMapping("/account/{accountId}")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
        public ResponseEntity<List<LoanDTO>> getLoansByAccount(@PathVariable Long accountId) {
                List<Loan> loans = loanRepository.findByAccountId(accountId);
                List<LoanDTO> dtos = loans.stream()
                                .map(loanMapper::toDTO)
                                .toList();
                return ResponseEntity.ok(dtos);
        }

        @GetMapping("/{loanId}")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
        public ResponseEntity<LoanDTO> getLoan(@PathVariable Long loanId) {
                return loanRepository.findById(loanId)
                                .map(loan -> ResponseEntity.ok(loanMapper.toDTO(loan)))
                                .orElseGet(() -> ResponseEntity.notFound().build());
        }

        @PostMapping
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
        public ResponseEntity<LoanDTO> createLoan(@RequestBody LoanDTO loanDTO) {
                Customer customer = customerRepository.findById(String.valueOf(loanDTO.getCustomerId()))
                                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id",
                                                loanDTO.getCustomerId()));

                Account account = accountRepository.findById(loanDTO.getAccountId())
                                .orElseThrow(() -> new ResourceNotFoundException("Account", "id",
                                                loanDTO.getAccountId()));

                BigDecimal principal = loanDTO.getPrincipalAmount();
                BigDecimal interestRate = loanDTO.getInterestRate();
                int tenureMonths = loanDTO.getTenureMonths();

                BigDecimal emi = calculateEMI(principal, interestRate, tenureMonths);
                BigDecimal totalInterest = emi.multiply(BigDecimal.valueOf(tenureMonths)).subtract(principal);
                BigDecimal loanAmount = principal.add(totalInterest);

                LocalDate startDate = loanDTO.getStartDate() != null ? loanDTO.getStartDate() : LocalDate.now();
                LocalDate endDate = startDate.plusMonths(tenureMonths);

                Loan loan = Loan.builder()
                                .customer(customer)
                                .account(account)
                                .loanType(loanDTO.getLoanType())
                                .principalAmount(principal)
                                .loanAmount(loanAmount)
                                .outstandingAmount(loanAmount)
                                .interestRate(interestRate)
                                .tenureMonths(tenureMonths)
                                .emiAmount(emi)
                                .startDate(startDate)
                                .endDate(endDate)
                                .nextEmiDate(startDate.plusMonths(1))
                                .emisPaid(0)
                                .emisRemaining(tenureMonths)
                                .status(Status.ACTIVE)
                                .collateralDetails(loanDTO.getCollateralDetails())
                                .isForeclosureAllowed(
                                                loanDTO.getIsForeclosureAllowed() != null
                                                                ? loanDTO.getIsForeclosureAllowed()
                                                                : true)
                                .foreclosureCharges(loanDTO.getForeclosureCharges())
                                .build();

                Loan savedLoan = loanRepository.save(loan);
                return ResponseEntity.ok(loanMapper.toDTO(savedLoan));
        }

        private BigDecimal calculateEMI(BigDecimal principal, BigDecimal annualInterestRate, int tenureMonths) {
                if (annualInterestRate == null || annualInterestRate.compareTo(BigDecimal.ZERO) == 0) {
                        return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
                }

                BigDecimal monthlyRate = annualInterestRate.divide(BigDecimal.valueOf(12 * 100), 6,
                                RoundingMode.HALF_UP);
                BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
                BigDecimal power = onePlusR.pow(tenureMonths);

                BigDecimal emi = principal.multiply(monthlyRate).multiply(power)
                                .divide(power.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);

                return emi;
        }
}

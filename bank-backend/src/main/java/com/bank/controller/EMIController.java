package com.bank.controller;

import com.bank.dto.loan.EMIDTO;
import com.bank.entity.EMI;
import com.bank.repository.EMIRepository;
import com.bank.repository.LoanRepository;
import com.bank.service.access.OwnershipAuthorizationService;
import com.bank.service.mapper.EMIMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/emis")
@RequiredArgsConstructor
public class EMIController {
    private final EMIRepository emiRepository;
    private final EMIMapper emiMapper;
    private final LoanRepository loanRepository;
    private final OwnershipAuthorizationService ownershipAuthorizationService;

    @GetMapping("/loan/{loanId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<EMIDTO>> getEMIsByLoan(@PathVariable Long loanId) {
        loanRepository.findById(loanId)
                .ifPresent(loan -> ownershipAuthorizationService.assertCustomerAccess(loan.getCustomer()));
        List<EMI> emis = emiRepository.findByLoanId(loanId);
        List<EMIDTO> dtos = emis.stream()
                .map(emiMapper::toDTO)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{emiId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
    @Transactional(readOnly = true)
    public ResponseEntity<EMIDTO> getEMI(@PathVariable Long emiId) {
        return emiRepository.findById(emiId)
                .map(emi -> {
                    ownershipAuthorizationService.assertCustomerAccess(emi.getLoan().getCustomer());
                    return ResponseEntity.ok(emiMapper.toDTO(emi));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

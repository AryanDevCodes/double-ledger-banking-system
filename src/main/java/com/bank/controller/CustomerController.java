package com.bank.controller;

import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.security.JwtUtil;
import com.bank.service.customer.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final JwtUtil jwtUtil;

    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
    @GetMapping
    public ResponseEntity<List<CustomerResponseDTO>> getAllCustomer() {
        return ResponseEntity.ok(customerService.findAll());
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR', 'ROLE_USER')")
    @GetMapping("/me")
    public ResponseEntity<CustomerResponseDTO> getMyProfile(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(customerService.findCustomerByUserId(userId));
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR')")
    @GetMapping("/email/{email}")
    public ResponseEntity<CustomerResponseDTO> getCustomerByEmail(@PathVariable String email) {
        return ResponseEntity.ok(customerService.findCustomerByEmail(email));
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER')")
    @GetMapping("/search")
    public ResponseEntity<List<CustomerResponseDTO>> searchCustomer(
            @RequestParam String name,
            @RequestParam String bankName) {

        return ResponseEntity.ok(customerService.findCustomerByNameAndBank(name, bankName));
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER')")
    @GetMapping("/bank")
    public ResponseEntity<List<CustomerResponseDTO>> getCustomersByBank(@RequestParam String bankName) {
        return ResponseEntity.ok(customerService.findCustomerByBank(bankName));
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_CUSTOMER_MANAGER')")
    @PatchMapping("/update")
    public ResponseEntity<CustomerResponseDTO> updateCustomer(@RequestParam String name,
            @RequestParam String email,
            @RequestParam String phoneNumber,
            @RequestBody CustomerRequestDTO dto) {
        return ResponseEntity.ok(customerService.updateCustomer(name, email, phoneNumber, dto));
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/delete")
    public ResponseEntity<CustomerResponseDTO> deleteCustomer(@RequestParam String id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok().build();
    }

}

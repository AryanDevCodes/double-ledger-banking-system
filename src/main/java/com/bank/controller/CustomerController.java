package com.bank.controller;

import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.service.customer.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<List<CustomerResponseDTO>> getAllCustomer(){
        return ResponseEntity.ok(customerService.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<CustomerResponseDTO>> searchCustomer(
            @RequestParam String name,
            @RequestParam String bankName ){

        return ResponseEntity.ok(customerService.findCustomerByNameAndBank(name,bankName));
    }

    @GetMapping("/bank")
    public ResponseEntity<List<CustomerResponseDTO>> getCustomersByBank(@RequestParam String bankName){
        return ResponseEntity.ok(customerService.findCustomerByBank(bankName));
    }

    @PatchMapping("/update")
    public ResponseEntity<CustomerResponseDTO> updateCustomer( @RequestParam String name,
                                                                     @RequestParam String email,
                                                                     @RequestParam String phoneNumber,
                                                                     @RequestBody CustomerRequestDTO dto ){
        return ResponseEntity.ok(customerService.updateCustomer(name, email, phoneNumber, dto));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<CustomerResponseDTO> deleteCustomer(@RequestParam Long id){
        customerService.deleteCustomer(id);
        return ResponseEntity.ok().build();
    }

}

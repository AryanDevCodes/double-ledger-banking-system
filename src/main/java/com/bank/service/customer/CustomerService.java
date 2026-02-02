package com.bank.service.customer;

import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;

import java.util.List;

public interface CustomerService {
    List<CustomerResponseDTO> findAll();
    List<CustomerResponseDTO> findCustomerByNameAndBank(String name, String bank);
    List<CustomerResponseDTO> findCustomerByBank(String bank);
    CustomerResponseDTO updateCustomer( String name,String email,String phoneNumber, CustomerRequestDTO dto );
    void deleteCustomer( String id );

}

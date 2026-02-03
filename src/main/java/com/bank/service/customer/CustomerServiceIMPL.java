package com.bank.service.customer;

import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.entity.Customer;
import com.bank.exception.InvalidDataException;
import com.bank.repository.CustomerRepository;
import com.bank.service.customer.mapper.CustomerMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerServiceIMPL implements CustomerService {
    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Override
    public List<CustomerResponseDTO> findAll() {
        List<Customer> customers = customerRepository.findAll();
        return customers.stream().map(customerMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<CustomerResponseDTO> findCustomerByNameAndBank( String name, String bank ) {
        if (name == null || name.trim().isEmpty() || bank == null || bank.trim().isEmpty()) {
            throw new InvalidDataException("name and bank should not be null or empty", "name/bank", name + "/" + bank);
        }

        List<Customer> customers = customerRepository.findCustomerByFullNameAndAccount_Bank_BankName(name,bank);
        return customers.stream().map(customerMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomerResponseDTO> findCustomerByBank( String bankName ) {
        if (bankName == null || bankName.trim().isEmpty()) {
            throw new InvalidDataException("bank should not be null or empty");
        }
        List<Customer> customers = customerRepository.findCustomerByAccount_Bank_BankName(bankName);
        return customers.stream().map(customerMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomerResponseDTO updateCustomer( String name,String email,String phoneNumber, CustomerRequestDTO dto ) {
        if (dto==null) {
            throw new InvalidDataException("Please enter some data to update");
        }

        Customer customer = customerRepository.findCustomerByFullNameAndEmailAndPhoneNumber(name,email,phoneNumber);
        if ( customer == null ) {
            throw new InvalidDataException("Customer not found");
        }
        customer.setFullName(dto.getFullName());
        customer.setEmail(dto.getEmail());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setKycStatus(dto.getKycStatus());
        customer.setAge(dto.getAge());
        customer.setAddress(dto.getAddress());
        customer.setCustomerStatus(dto.getCustomerStatus());

        return customerMapper.toResponseDTO(customerRepository.save(customer));
    }

    @Override
    public void deleteCustomer( String id ) {
        if ( id == null ) {
            throw new InvalidDataException("id should not be null");
        }
        customerRepository.deleteById(id);
    }
}

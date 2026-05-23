package com.bank.service.customer;

import com.bank.dto.PagedResponse;
import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.entity.Customer;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.CustomerRepository;
import com.bank.service.customer.mapper.CustomerMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

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
  public PagedResponse<CustomerResponseDTO> findAllPaginated(Pageable pageable) {
    Page<Customer> customerPage = customerRepository.findAll(pageable);
    List<CustomerResponseDTO> content = customerPage.getContent().stream()
        .map(customerMapper::toResponseDTO)
        .collect(Collectors.toList());
    return PagedResponse.of(content, pageable.getPageNumber(), pageable.getPageSize(), customerPage.getTotalElements());
  }

  @Override
  public List<CustomerResponseDTO> findCustomerByNameAndBank(String name, String bank) {
    if (name == null || name.trim().isEmpty() || bank == null || bank.trim().isEmpty()) {
      throw new InvalidDataException(
          "name and bank should not be null or empty", "name/bank", name + "/" + bank);
    }
    List<Customer> customers = customerRepository.findCustomerByFullNameAndAccount_Bank_BankName(name, bank);
    return customers.stream().map(customerMapper::toResponseDTO).collect(Collectors.toList());
  }

  @Override
  public List<CustomerResponseDTO> findCustomerByBank(String bankName) {
    if (bankName == null || bankName.trim().isEmpty()) {
      throw new InvalidDataException("bank should not be null or empty");
    }
    // Admins can query any bank
    List<Customer> customers = customerRepository.findCustomerByAccount_Bank_BankName(bankName);
    return customers.stream().map(customerMapper::toResponseDTO).collect(Collectors.toList());
  }

  /**
   * Check if current user has ROLE_ADMIN
   */
  private boolean isAdminUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) {
      return false;
    }
    return auth.getAuthorities().stream()
        .anyMatch(grantedAuth -> "ROLE_ADMIN".equals(grantedAuth.getAuthority()));
  }

  @Override
  public CustomerResponseDTO findCustomerByEmail(String email) {
    if (email == null || email.trim().isEmpty()) {
      throw new InvalidDataException("email should not be null or empty");
    }
    Customer customer = customerRepository.findByEmail(email);
    if (customer == null) {
      throw new ResourceNotFoundException("Customer not found with email: " + email);
    }
    return customerMapper.toResponseDTO(customer);
  }

  @Override
  public CustomerResponseDTO findCustomerByUserId(Long userId) {
    if (userId == null) {
      throw new InvalidDataException("userId should not be null");
    }
    List<Customer> customers = customerRepository.findByUserId(userId);
    if (customers.isEmpty()) {
      throw new ResourceNotFoundException("Customer not found for user ID: " + userId);
    }
    return customerMapper.toResponseDTO(customers.get(0));
  }

  @Override
  @Transactional
  public CustomerResponseDTO updateCustomer(
      String name, String email, String phoneNumber, CustomerRequestDTO dto) {
    if (dto == null) {
      throw new InvalidDataException("Please enter some data to update");
    }
    Customer customer = customerRepository.findCustomerByFullNameAndEmailAndPhoneNumber(name, email, phoneNumber);
    if (customer == null) {
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
  public void deleteCustomer(String id) {
    if (id == null) {
      throw new InvalidDataException("id should not be null");
    }
    customerRepository.deleteById(id);
  }
}

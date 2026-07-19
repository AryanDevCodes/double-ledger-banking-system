package com.bank.service.customer;

import com.bank.dto.PagedResponse;
import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface CustomerService {
  List<CustomerResponseDTO> findAll();

  PagedResponse<CustomerResponseDTO> findAllPaginated(Pageable pageable);

  List<CustomerResponseDTO> findCustomerByNameAndBank(String name, String bank);

  List<CustomerResponseDTO> findCustomerByBank(String bank);

  CustomerResponseDTO findCustomerByEmail(String email);

  CustomerResponseDTO findCustomerByUserId(Long userId);

  CustomerResponseDTO updateCustomer(
      String name, String email, String phoneNumber, CustomerRequestDTO dto);

  void deleteCustomer(String id);
}

package com.bank.service.customer.mapper;

import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.entity.Customer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    Customer toEntity( CustomerRequestDTO dto );
    CustomerResponseDTO toResponseDTO( Customer entity );
}

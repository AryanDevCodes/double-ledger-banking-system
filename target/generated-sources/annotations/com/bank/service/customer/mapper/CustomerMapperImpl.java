package com.bank.service.customer.mapper;

import com.bank.dto.customer.CustomerRequestDTO;
import com.bank.dto.customer.CustomerResponseDTO;
import com.bank.entity.Customer;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-01T03:16:31+0530",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.8 (Oracle Corporation)"
)
@Component
public class CustomerMapperImpl implements CustomerMapper {

    @Override
    public Customer toEntity(CustomerRequestDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Customer.CustomerBuilder customer = Customer.builder();

        customer.fullName( dto.getFullName() );
        customer.email( dto.getEmail() );
        customer.phoneNumber( dto.getPhoneNumber() );
        customer.kycStatus( dto.getKycStatus() );
        customer.customerStatus( dto.getCustomerStatus() );

        return customer.build();
    }

    @Override
    public CustomerResponseDTO toResponseDTO(Customer entity) {
        if ( entity == null ) {
            return null;
        }

        CustomerResponseDTO customerResponseDTO = new CustomerResponseDTO();

        if ( entity.getId() != null ) {
            customerResponseDTO.setId( Long.parseLong( entity.getId() ) );
        }
        customerResponseDTO.setFullName( entity.getFullName() );
        customerResponseDTO.setEmail( entity.getEmail() );
        customerResponseDTO.setPhoneNumber( entity.getPhoneNumber() );
        customerResponseDTO.setKycStatus( entity.getKycStatus() );
        customerResponseDTO.setCustomerStatus( entity.getCustomerStatus() );

        return customerResponseDTO;
    }
}

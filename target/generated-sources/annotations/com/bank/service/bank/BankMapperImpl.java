package com.bank.service.bank;

import com.bank.dto.bank.BankRequestDTO;
import com.bank.dto.bank.BankResponseDTO;
import com.bank.entity.Bank;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-01T03:16:31+0530",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.8 (Oracle Corporation)"
)
@Component
public class BankMapperImpl implements BankMapper {

    @Override
    public Bank toEntity(BankRequestDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Bank.BankBuilder bank = Bank.builder();

        bank.bankName( dto.getBankName() );
        bank.branch( dto.getBranch() );
        bank.ifscCode( dto.getIfscCode() );
        bank.city( dto.getCity() );
        bank.state( dto.getState() );
        bank.branchAddress( dto.getBranchAddress() );

        return bank.build();
    }

    @Override
    public BankResponseDTO toResponse(Bank bank) {
        if ( bank == null ) {
            return null;
        }

        BankResponseDTO bankResponseDTO = new BankResponseDTO();

        bankResponseDTO.setAccountNumbers( accountsToNumbers( bank.getAccounts() ) );
        bankResponseDTO.setId( bank.getId() );
        bankResponseDTO.setBankName( bank.getBankName() );
        bankResponseDTO.setBranch( bank.getBranch() );
        bankResponseDTO.setIfscCode( bank.getIfscCode() );
        bankResponseDTO.setCity( bank.getCity() );
        bankResponseDTO.setState( bank.getState() );
        bankResponseDTO.setBranchAddress( bank.getBranchAddress() );

        return bankResponseDTO;
    }
}

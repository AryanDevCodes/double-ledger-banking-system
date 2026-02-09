package com.bank.service.bank;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import com.bank.dto.bank.BankRequestDTO;
import com.bank.dto.bank.BankResponseDTO;
import com.bank.exception.ResourceNotFoundException;
import com.bank.exception.InvalidDataException;

import com.bank.repository.BankRepository;
import com.bank.entity.Bank;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BankServiceIMPL implements BankService {

    private final BankRepository repository;
    private final BankMapper mapper;

    @Override
    public BankResponseDTO findById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new InvalidDataException("Bank ID cannot be null or empty", "id", id);
        }

        Bank bank = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank", "id", id));

        return mapper.toResponse(bank);
    }

    @Override
    public List<BankResponseDTO> findAllBank() {
        List<Bank> banks = repository.findAll();
        return banks.stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public BankResponseDTO findByUpiId(String upiId) {
        if (upiId == null || upiId.trim().isEmpty()) {
            throw new InvalidDataException("UPI ID cannot be null or empty", "upiId", upiId);
        }

        Bank bank = repository.findByUpiId(upiId);
        if (bank == null) {
            throw new ResourceNotFoundException("Bank not found for UPI ID: " + upiId);
        }

        return mapper.toResponse(bank);
    }

    @Override
    @SuppressWarnings("null")
    public BankResponseDTO createBank(BankRequestDTO dto) {
        Bank bank = mapper.toEntity(dto);
        return mapper.toResponse(repository.save(bank));
    }

    @Override
    @Transactional
    public BankResponseDTO updateBank(String id, BankRequestDTO dto) {
        if (id == null || id.trim().isEmpty()) {
            throw new InvalidDataException("Bank ID cannot be null or empty", "id", id);
        }

        Bank bank = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank", "id", id));

        bank.setBankName(dto.getBankName());
        bank.setBranch(dto.getBranch());
        bank.setBranchAddress(dto.getBranchAddress());
        bank.setCity(dto.getCity());
        bank.setIfscCode(dto.getIfscCode());
        bank.setState(dto.getState());

        return mapper.toResponse(repository.save(bank));
    }

    @Override
    @Transactional
    public void deleteBank(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new InvalidDataException("Bank ID cannot be null or empty", "id", id);
        }

        Bank bank = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank", "id", id));

        @SuppressWarnings("null")
        var deleted = bank;
        repository.delete(deleted);
    }

}

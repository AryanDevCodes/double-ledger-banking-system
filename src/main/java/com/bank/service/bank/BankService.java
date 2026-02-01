package com.bank.service.bank;

import com.bank.dto.bank.BankRequestDTO;
import com.bank.dto.bank.BankResponseDTO;
import java.util.List;

public interface BankService {

    BankResponseDTO findById(String id);

    List<BankResponseDTO> findAllBank();

    BankResponseDTO createBank(BankRequestDTO dto);

    BankResponseDTO updateBank(String id, BankRequestDTO dto);

    void deleteBank(String id);






}

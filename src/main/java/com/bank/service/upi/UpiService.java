package com.bank.service.upi;

import com.bank.dto.transaction.TransactionResponseDTO;
import com.bank.entity.Account;
import com.bank.dto.upi.UpiPayRequestDTO;
import com.bank.dto.upi.UpiProfileResponseDTO;
import com.bank.dto.upi.UpiRegisterRequestDTO;
import java.util.List;

public interface UpiService {
  void registerUpi(Account account, String request);

  TransactionResponseDTO executeUpiPayment(UpiPayRequestDTO dto);

  UpiProfileResponseDTO registerUpiProfile(UpiRegisterRequestDTO dto);

  UpiProfileResponseDTO getUpiProfile(String upiId);

  List<UpiProfileResponseDTO> getAllUpiProfiles();

  List<UpiProfileResponseDTO> getUpiProfilesByAccountNumber(String accountNumber);

  List<UpiProfileResponseDTO> getUpiProfilesForUser(Long userId);

  UpiProfileResponseDTO updateUpiStatus(String upiId, String status);

  void deleteUpiProfile(String upiId);
}

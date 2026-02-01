package com.bank.controller;

import com.bank.dto.account.AccountRequestDTO;
import com.bank.dto.account.AccountResponseDTO;
import com.bank.service.account.AccountsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountController {


    private final AccountsService accountsService;

    @GetMapping
    public ResponseEntity<List<AccountResponseDTO>> getAllAccounts(){
        return ResponseEntity.ok(accountsService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponseDTO> getAccount(@PathVariable String id){
        return ResponseEntity.ok(accountsService.findByAccountNumber(id));
    }

    @GetMapping("/name/{bankName}")
    public ResponseEntity<List<AccountResponseDTO>> getAccountsByBankName(@PathVariable String bankName){
        return ResponseEntity.ok(accountsService.findByBank(bankName));
    }

    @PostMapping("/{bankName}")
    public ResponseEntity<AccountResponseDTO> createAccount( @PathVariable String bankName, @RequestBody AccountRequestDTO dto ){
        return ResponseEntity.ok(accountsService.createAccount(bankName,dto));
    }

    @PatchMapping("/{accNumber}")
    public ResponseEntity<AccountResponseDTO> updateAccount(@PathVariable String accNumber, @RequestBody AccountRequestDTO dto ){
        return ResponseEntity.ok(accountsService.updateAccount(accNumber,dto));
    }

    @DeleteMapping("/{accNumber}")
    public ResponseEntity<AccountResponseDTO> deleteAccount(@PathVariable String accNumber){
        accountsService.deleteAccount(accNumber);
        return ResponseEntity.ok().build();
    }

}

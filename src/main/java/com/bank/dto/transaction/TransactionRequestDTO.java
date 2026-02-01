package com.bank.dto.transaction;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransactionRequestDTO {

    @NotNull(message = "sender account can't be null")
    private String senderAccount;
    @NotNull(message = "please provide a receiverAccount")
    private String receiverAccount;

    private BigDecimal amount;

    // Optional: can provide bankName instead of full account number for easier transactions
    private String senderBankName;
    private String receiverBankName;

}

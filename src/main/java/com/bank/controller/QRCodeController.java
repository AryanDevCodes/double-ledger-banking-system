package com.bank.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/qr")
@RequiredArgsConstructor
public class QRCodeController {

  /** Generate QR code for UPI payment Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
  @GetMapping("/generate")
  public ResponseEntity<byte[]> generateQRCode(
      @RequestParam String upiId,
      @RequestParam(required = false) String name,
      @RequestParam(required = false) Double amount,
      @RequestParam(defaultValue = "300") int width,
      @RequestParam(defaultValue = "300") int height) {
    try {
      // Build UPI payment string
      StringBuilder upiString = new StringBuilder("upi://pay?pa=" + upiId);

      if (name != null && !name.isEmpty()) {
        upiString.append("&pn=").append(name.replace(" ", "%20"));
      }

      if (amount != null && amount > 0) {
        upiString.append("&am=").append(amount);
      }

      upiString.append("&cu=INR");

      // Generate QR Code
      QRCodeWriter qrCodeWriter = new QRCodeWriter();
      Map<EncodeHintType, Object> hints = new HashMap<>();
      hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

      BitMatrix bitMatrix =
          qrCodeWriter.encode(upiString.toString(), BarcodeFormat.QR_CODE, width, height, hints);

      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
      byte[] qrCodeImage = outputStream.toByteArray();

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.IMAGE_PNG);
      headers.setContentLength(qrCodeImage.length);

      return new ResponseEntity<>(qrCodeImage, headers, HttpStatus.OK);

    } catch (WriterException | IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /** Generate QR code for account details */
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')")
  @GetMapping("/account")
  public ResponseEntity<byte[]> generateAccountQR(
      @RequestParam String accountNumber,
      @RequestParam String bankName,
      @RequestParam String ifscCode,
      @RequestParam(defaultValue = "300") int width,
      @RequestParam(defaultValue = "300") int height) {
    try {
      String accountInfo =
          String.format("Account: %s\nBank: %s\nIFSC: %s", accountNumber, bankName, ifscCode);

      QRCodeWriter qrCodeWriter = new QRCodeWriter();
      BitMatrix bitMatrix = qrCodeWriter.encode(accountInfo, BarcodeFormat.QR_CODE, width, height);

      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
      byte[] qrCodeImage = outputStream.toByteArray();

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.IMAGE_PNG);

      return new ResponseEntity<>(qrCodeImage, headers, HttpStatus.OK);

    } catch (WriterException | IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }
}

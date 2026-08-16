import CryptoKit
import ExpoModulesCore
import Security

private enum SpiceSyncCryptoError: Error {
  case invalidBase64
  case invalidRandomLength
  case missingCombinedCiphertext
}

private let syncProtocolInfo = Data("spicesync-sync-v2".utf8)

private func decodeBase64(_ value: String) throws -> Data {
  guard let data = Data(base64Encoded: value) else {
    throw SpiceSyncCryptoError.invalidBase64
  }
  return data
}

private func encodeBase64(_ value: Data) -> String {
  value.base64EncodedString()
}

private func deriveSharedKey(
  privateKeyBase64: String,
  partnerPublicKeyBase64: String
) throws -> SymmetricKey {
  let privateKey = try Curve25519.KeyAgreement.PrivateKey(
    rawRepresentation: decodeBase64(privateKeyBase64)
  )
  let publicKey = try Curve25519.KeyAgreement.PublicKey(
    rawRepresentation: decodeBase64(partnerPublicKeyBase64)
  )
  let sharedSecret = try privateKey.sharedSecretFromKeyAgreement(with: publicKey)
  return sharedSecret.hkdfDerivedSymmetricKey(
    using: SHA256.self,
    salt: Data(),
    sharedInfo: syncProtocolInfo,
    outputByteCount: 32
  )
}

public final class SpiceSyncCryptoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SpiceSyncCrypto")

    Function("randomBytes") { (length: Int) throws -> String in
      guard length > 0 else {
        throw SpiceSyncCryptoError.invalidRandomLength
      }
      var bytes = [UInt8](repeating: 0, count: length)
      let status = SecRandomCopyBytes(kSecRandomDefault, length, &bytes)
      guard status == errSecSuccess else {
        throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
      }
      return encodeBase64(Data(bytes))
    }

    Function("sha256") { (inputBase64: String) throws -> String in
      let digest = SHA256.hash(data: try decodeBase64(inputBase64))
      return encodeBase64(Data(digest))
    }

    Function("generateSigningKeypair") { () -> [String: String] in
      let privateKey = Curve25519.Signing.PrivateKey()
      return [
        "privateKey": encodeBase64(privateKey.rawRepresentation),
        "publicKey": encodeBase64(privateKey.publicKey.rawRepresentation)
      ]
    }

    Function("generateEncryptionKeypair") { () -> [String: String] in
      let privateKey = Curve25519.KeyAgreement.PrivateKey()
      return [
        "privateKey": encodeBase64(privateKey.rawRepresentation),
        "publicKey": encodeBase64(privateKey.publicKey.rawRepresentation)
      ]
    }

    Function("signEd25519") {
      (privateKeyBase64: String, messageBase64: String) throws -> String in
      let privateKey = try Curve25519.Signing.PrivateKey(
        rawRepresentation: decodeBase64(privateKeyBase64)
      )
      let signature = try privateKey.signature(for: decodeBase64(messageBase64))
      return encodeBase64(signature)
    }

    Function("verifyEd25519") {
      (
        publicKeyBase64: String,
        signatureBase64: String,
        messageBase64: String
      ) -> Bool in
      do {
        let publicKey = try Curve25519.Signing.PublicKey(
          rawRepresentation: decodeBase64(publicKeyBase64)
        )
        return publicKey.isValidSignature(
          try decodeBase64(signatureBase64),
          for: try decodeBase64(messageBase64)
        )
      } catch {
        return false
      }
    }

    Function("encryptForPartner") {
      (
        privateKeyBase64: String,
        partnerPublicKeyBase64: String,
        plaintext: String
      ) throws -> [String: String] in
      let key = try deriveSharedKey(
        privateKeyBase64: privateKeyBase64,
        partnerPublicKeyBase64: partnerPublicKeyBase64
      )
      let sealed = try AES.GCM.seal(Data(plaintext.utf8), using: key)
      guard let combined = sealed.combined else {
        throw SpiceSyncCryptoError.missingCombinedCiphertext
      }
      let encryptedPayload = encodeBase64(combined)
      let payloadHash = SHA256.hash(data: Data(encryptedPayload.utf8))
      return [
        "encryptedPayload": encryptedPayload,
        "payloadHash": encodeBase64(Data(payloadHash))
      ]
    }

    Function("decryptFromPartner") {
      (
        privateKeyBase64: String,
        partnerPublicKeyBase64: String,
        encryptedPayload: String
      ) throws -> String in
      let key = try deriveSharedKey(
        privateKeyBase64: privateKeyBase64,
        partnerPublicKeyBase64: partnerPublicKeyBase64
      )
      let sealed = try AES.GCM.SealedBox(
        combined: decodeBase64(encryptedPayload)
      )
      let plaintext = try AES.GCM.open(sealed, using: key)
      guard let value = String(data: plaintext, encoding: .utf8) else {
        throw SpiceSyncCryptoError.invalidBase64
      }
      return value
    }
  }
}

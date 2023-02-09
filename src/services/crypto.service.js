import forge, { pki } from "node-forge";
import { encode, decode } from "ts-steganography";

export const getCertificateFromDer = (cert, password, cn) => {
  const p12Der = forge.util.decode64(cert);
  // binary data
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  // decrypt p12 using the password 'password'
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
  const bags = p12.getBags({ friendlyName: cn });
  const pk = bags.friendlyName[0].key;
  const certificate = bags.friendlyName[1];
  return { pk, certificate: certificate.cert };
};

export const createAesKey = () => {
  // aes 256
  const aesKey = forge.random.getBytesSync(32);
  const aesIv = forge.random.getBytesSync(32);
  return { aesKey, aesIv, alg: "AES-CBC" };
};

export const encryptWithPublicKey = (pubKey, data) => {
  return pubKey.encrypt(data);
};

export const decryptWithPrivateKey = (privKey, data) => {
  return privKey.decrypt(data);
};

export const certificateToPem = (cert) => {
  return pki.certificateToPem(cert);
};

export const certificateFromPem = (pem) => {
  return pki.certificateFromPem(pem);
};

export const pubKeyToPem = (pubKey) => {
  return pki.publicKeyToPem(pubKey);
};

export const pubKeyFromPem = (pem) => {
  return pki.privateKeyFromPem(pem);
};

export const sign = (key, data) => {
  const md = forge.md.sha256.create();
  md.update(JSON.stringify(data), "utf8");
  const signature = key.sign(md);
  return forge.util.encode64(signature);
};

export const verify = (key, signature, data) => {
  const md = forge.md.sha256.create();
  md.update(JSON.stringify(data), "utf8");
  return key.verify(md.digest().bytes(), forge.util.decode64(signature));
};

export const encyptAes = (aesKey, message) => {
  const cipher = forge.cipher.createCipher(aesKey.alg, aesKey.aesKey);
  cipher.start({ iv: aesKey.aesIv });
  cipher.update(forge.util.createBuffer(JSON.stringify(message)));
  cipher.finish();
  const out = cipher.output;
  return out;
};

export const decryptAes = (aesKey, messageEnc) => {
  const decipher = forge.cipher.createDecipher(aesKey.alg, aesKey.aesKey);
  decipher.start({ iv: aesKey.aesIv });
  decipher.update(forge.util.createBuffer(messageEnc));
  decipher.finish();
  return JSON.parse(decipher.output);
};

export const decryptAesPromise = (aesKey, messageEnc) => {
  return new Promise((resolve, reject) => {
    try {
      const decryptedMessage = decryptAes(aesKey, messageEnc);
      resolve(decryptedMessage);
    } catch (error) {
      reject(error);
    }
  });
};

export const steganographyEncode = (data, image) => {
  return encode(data, image).then((res) => res);
};

export const steganographyDecode = async (data) => decode(data).then((res) => res);

export default {
  getCertificateFromDer,
  createAesKey,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  certificateToPem,
  certificateFromPem,
  pubKeyToPem,
  pubKeyFromPem,
  encyptAes,
  decryptAes,
  sign,
  verify,
  decryptAesPromise,
  steganographyEncode,
  steganographyDecode
};

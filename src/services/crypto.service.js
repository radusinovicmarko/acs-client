import forge from "node-forge";

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

export default {
  getCertificateFromDer,
  createAesKey
};

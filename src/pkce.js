// Helper functions for PKCE (Proof Key of Code Exchange) Extension for OAuth2
// see https://tools.ietf.org/html/rfc7636#section-4
import crypto from "crypto";

export const base64URLEncode = (str) => {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

export const sha256 = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest();
};

export const generateCodeChallenge = () => {
  // generate a code verifier for PKCE extension of Auth Code Flow
  // see https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce
  var code_verifier = base64URLEncode(crypto.randomBytes(32));
  // store the code_verifier as we'll need it later on when exchanging the auth code for a token
  localStorage.setItem("code_verifier", code_verifier);
  // generate code challenge to be sent with authorization request
  return base64URLEncode(sha256(code_verifier));
};

export const getCodeVerifier = () => {
  // obtain the stored code verifier (stored by generateCodeChallenge)
  const code_verifier = localStorage.getItem("code_verifier");

  if (code_verifier === null) {
    throw new Error("No Code Verifier found");
  }
  return code_verifier;
};

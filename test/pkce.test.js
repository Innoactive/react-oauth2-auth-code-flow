const { generateCodeChallenge, getCodeVerifier } = require("../src/pkce");

describe("generateCodeChallenge", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("stores verifier in localStorage", () => {
    // When generating a new code challenge
    generateCodeChallenge();

    // Then expect the respective code_verifier to be put into the local storage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "code_verifier",
      expect.any(String)
    );
  });
});

describe("getCodeVerifier", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("throws error if no code verifier in localstorage", () => {
    // When attempting to get the code verifier without having previously generated one
    // Then expect an error to be thrown
    expect(() => getCodeVerifier()).toThrow("No Code Verifier found");
  });

  test("returns from localstorage", () => {
    // Given a code_verifier in the local storage
    localStorage.setItem("code_verifier", "test");

    // When attempting to get the code verifier without having previously generated one
    const codeVerifier = getCodeVerifier();

    // Then expect an error to be thrown
    expect(codeVerifier).toBe("test");
  });
});

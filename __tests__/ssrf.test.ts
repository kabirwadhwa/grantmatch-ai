import { isPrivateIp, validateSafeUrl } from "../src/lib/security/ssrf";

describe("Security - SSRF Defense Layer", () => {
  it("flags private and loopback IPv4 addresses as private", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("127.0.0.2")).toBe(true);
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.254")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true); // AWS / GCP metadata
    expect(isPrivateIp("0.0.0.0")).toBe(true);
  });

  it("flags private IPv6 addresses as private", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
  });

  it("identifies public Internet addresses as safe", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("142.250.190.46")).toBe(false);
  });

  it("rejects non-http/https protocols", async () => {
    await expect(validateSafeUrl("ftp://example.com/file")).rejects.toThrow("Forbidden protocol");
    await expect(validateSafeUrl("file:///etc/passwd")).rejects.toThrow("Forbidden protocol");
    await expect(validateSafeUrl("gopher://example.com")).rejects.toThrow("Forbidden protocol");
  });

  it("rejects internal hostname patterns", async () => {
    await expect(validateSafeUrl("http://localhost:3000")).rejects.toThrow("blocked");
    await expect(validateSafeUrl("http://internal.service.local")).rejects.toThrow("blocked");
    await expect(validateSafeUrl("http://127.0.0.1:8080")).rejects.toThrow("blocked");
    await expect(validateSafeUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow("blocked");
  });
});

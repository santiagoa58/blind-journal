import { describe, expect, it } from "vitest";
import { base64ToUint8Array, base64ToValue, toBase64, valueToBase64Url } from "@/crypto/base64";

const value = {
  id: "journal-entry",
  title: "Entrada privada 🔒",
};

describe("Base64 encoding", () => {
  describe("toBase64", () => {
    it("encodes arbitrary bytes with the standard alphabet and padding", () => {
      expect(toBase64(new Uint8Array([0, 127, 128, 255]))).toBe("AH+A/w==");
    });

    it("encodes strings as UTF-8 rather than treating them as Latin-1", () => {
      expect(toBase64("Entrada privada 🔒")).toBe("RW50cmFkYSBwcml2YWRhIPCflJI=");
    });
  });

  describe("base64ToUint8Array", () => {
    it.each([
      ["padded standard Base64", "+/8="],
      ["unpadded standard Base64", "+/8"],
      ["unpadded Base64URL", "-_8"],
    ])("decodes %s", (_description, encoded) => {
      expect(base64ToUint8Array(encoded)).toEqual(new Uint8Array([251, 255]));
    });

    it.each(["a", "%%%", "A==="])("rejects malformed input: %s", (encoded) => {
      expect(() => base64ToUint8Array(encoded)).toThrow();
    });
  });

  describe("JSON values", () => {
    it("round-trips standard Base64 JSON containing Unicode", () => {
      expect(base64ToValue(toBase64(JSON.stringify(value)))).toEqual(value);
    });

    it("round-trips unpadded Base64URL JSON", () => {
      const encoded = valueToBase64Url(value);

      expect(encoded).not.toMatch(/[+/=]/);
      expect(base64ToValue(encoded)).toEqual(value);
    });

    it("rejects decoded bytes that are not valid UTF-8", () => {
      expect(() => base64ToValue(toBase64(new Uint8Array([0xc3, 0x28])))).toThrow(TypeError);
    });

    it("rejects decoded text that is not JSON", () => {
      expect(() => base64ToValue(toBase64("not JSON"))).toThrow(SyntaxError);
    });

    it.each([undefined, () => undefined])("rejects values with no JSON representation", (input) => {
      expect(() => valueToBase64Url(input)).toThrow(TypeError);
    });
  });
});

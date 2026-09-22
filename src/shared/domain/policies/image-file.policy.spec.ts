import { describe, expect, test } from "vitest"

import { validateImageFile } from "./image-file.policy"

describe("validateImageFile", () => {
  describe("Given a JPEG under the size limit", () => {
    test("When validating, Then it is valid", () => {
      const result = validateImageFile({ mimeType: "image/jpeg", sizeBytes: 1_000_000 })

      expect(result).toEqual({ valid: true })
    })
  })

  describe("Given a PNG under the size limit", () => {
    test("When validating, Then it is valid", () => {
      const result = validateImageFile({ mimeType: "image/png", sizeBytes: 1_000_000 })

      expect(result).toEqual({ valid: true })
    })
  })

  describe("Given a file in an unsupported format", () => {
    test("When validating, Then it is invalid with reason 'unsupported_format'", () => {
      const result = validateImageFile({ mimeType: "application/pdf", sizeBytes: 1_000 })

      expect(result).toEqual({ valid: false, reason: "unsupported_format" })
    })
  })

  describe("Given a file exceeding the maximum allowed size", () => {
    test("When validating, Then it is invalid with reason 'too_large'", () => {
      const result = validateImageFile({ mimeType: "image/jpeg", sizeBytes: 10_000_000 })

      expect(result).toEqual({ valid: false, reason: "too_large" })
    })
  })
})

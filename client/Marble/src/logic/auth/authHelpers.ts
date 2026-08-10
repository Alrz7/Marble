export interface UrlValidationResult {
  isValid: boolean;
  cleanUrl: string;
  error?: string;
}

export function validateAndCleanServerUrl(
  rawInput: string,
): UrlValidationResult {
  if (!rawInput || !rawInput.trim()) {
    return {
      isValid: false,
      cleanUrl: "",
      error: "url can Not be empty",
    };
  }

  let cleaned = rawInput.trim();

  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  cleaned = cleaned.replace(/\/+$/, "");

  try {
    const parsed = new URL(cleaned);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        isValid: false,
        cleanUrl: "",
        error: "url should start with http: or https:",
      };
    }

    return {
      isValid: true,
      cleanUrl: cleaned,
    };
  } catch {
    return {
      isValid: false,
      cleanUrl: "",
      error: "url format is not valid",
    };
  }
}

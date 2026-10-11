import { Lead } from "../models/Lead.js";

const countryCodes = new Set([
  "saudi-arabia",
  "qatar",
  "uae",
  "oman",
  "bahrain",
  "kuwait",
]);
const serviceTypes = new Set([
  "dataflow",
  "licensing-exam",
  "professional-licensing",
]);

export function normalizePhone(input) {
  // Keep a leading plus, remove spaces and punctuation. This is normalization, not full country validation.
  const compact = String(input ?? "")
    .trim()
    .replace(/[\s().-]/g, "");
  return compact.startsWith("+")
    ? `+${compact.slice(1).replace(/\D/g, "")}`
    : compact.replace(/\D/g, "");
}

export function validateLeadPayload(body = {}) {
  const errors = [];
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const normalizedPhone = normalizePhone(phone);
  const profession = String(body.profession ?? "");
  const specialty = String(body.specialty ?? "").trim();
  const targetCountry = String(body.targetCountry ?? "");
  const serviceType = String(body.serviceType ?? "");

  if (fullName.length < 2 || fullName.length > 100)
    errors.push("Name must be between 2 and 100 characters");
  if (normalizedPhone.length < 8 || normalizedPhone.length > 16)
    errors.push(
      "Enter a valid phone number including country code when possible",
    );
  if (!["doctor", "nurse"].includes(profession))
    errors.push("Choose doctor or nurse");
  if (specialty.length < 2 || specialty.length > 100)
    errors.push("Specialty must be between 2 and 100 characters");
  if (!countryCodes.has(targetCountry))
    errors.push("Choose a supported destination country");
  if (!serviceTypes.has(serviceType)) errors.push("Choose a supported service");
  if (body.consentToShare !== true)
    errors.push(
      "Consent to share your contact details with the service provider is required",
    );

  return {
    errors,
    value: {
      fullName,
      phone,
      normalizedPhone,
      profession,
      specialty,
      targetCountry,
      serviceType,
      preferredContactTime: String(body.preferredContactTime ?? "")
        .trim()
        .slice(0, 100),
      consentToShare: body.consentToShare === true,
      consentAt: new Date(),
      source:
        String(body.source ?? "website")
          .trim()
          .slice(0, 100) || "website",
      campaign: String(body.campaign ?? "")
        .trim()
        .slice(0, 150),
    },
  };
}

export async function createLead(body) {
  const { errors, value } = validateLeadPayload(body);
  if (errors.length) {
    const error = new Error("Validation failed");
    error.status = 400;
    error.details = errors;
    throw error;
  }

  // Reject any previous request from this mobile number
const existingLead = await Lead.findOne({
  normalizedPhone: value.normalizedPhone,
});

if (existingLead) {
  const error = new Error(
    "This mobile number has already submitted a request."
  );
  error.statusCode = 409;
  throw error;
}

return Lead.create(value);
}

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { Lead } from "../models/Lead.js";

const router = Router();

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many submission attempts. Please try again later.",
  },
});

const allowedProfessions = ["doctor", "nurse"];

const allowedCountries = [
  "saudi-arabia",
  "qatar",
  "uae",
  "oman",
  "bahrain",
  "kuwait",
];

const allowedServices = [
  "dataflow",
  "licensing-exam",
  "professional-licensing",
];

function cleanString(value, maxLength) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim();

  if (!cleaned || cleaned.length > maxLength) return null;

  return cleaned;
}

function normalizePhone(phone) {
  // Keep digits only for duplicate detection.
  return phone.replace(/\D/g, "");
}

function generateReference() {
  return `ML-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function validPhone(phone) {
  // Accept common international phone formatting.
  if (!/^[+\d\s().-]+$/.test(phone)) return false;

  const digits = normalizePhone(phone);

  return digits.length >= 7 && digits.length <= 15;
}

function sanitizeCampaign(value) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, 150);
}

router.post("/", leadLimiter, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message: "Invalid request body.",
      });
    }

    // Honeypot: bots may fill this hidden field.
    if (
      typeof req.body.website === "string" &&
      req.body.website.trim() !== ""
    ) {
      // Do not create a lead or reveal honeypot detection.
      return res.status(201).json({
        reference: generateReference(),
      });
    }

    const fullName = cleanString(req.body.fullName, 100);
    const phone = cleanString(req.body.phone, 20);
    const profession = req.body.profession;
    const specialty = cleanString(req.body.specialty, 100);
    const targetCountry = req.body.targetCountry;
    const serviceType = req.body.serviceType;

    const preferredContactTime =
      req.body.preferredContactTime === undefined ||
      req.body.preferredContactTime === ""
        ? ""
        : typeof req.body.preferredContactTime === "string"
          ? req.body.preferredContactTime.trim()
          : null;

    const consentToShare = req.body.consentToShare;

    if (
      !fullName ||
      fullName.length < 2 ||
      !phone ||
      !validPhone(phone) ||
      !allowedProfessions.includes(profession) ||
      !specialty ||
      !allowedCountries.includes(targetCountry) ||
      !allowedServices.includes(serviceType) ||
      preferredContactTime === null ||
      preferredContactTime.length > 100 ||
      consentToShare !== true
    ) {
      return res.status(400).json({
        message: "Please check the submitted information and try again.",
      });
    }

    const normalizedPhone = normalizePhone(phone);

    const campaign = sanitizeCampaign(req.body.campaign);

    // Never trust the client to choose source or consentAt.
    const lead = await Lead.create({
      reference: generateReference(),
      fullName,
      phone,
      normalizedPhone,
      profession,
      specialty,
      targetCountry,
      serviceType,
      preferredContactTime,
      consentToShare: true,
      consentAt: new Date(),
      source: "website",
      campaign,
    });

    return res.status(201).json({
      message: "Your request has been submitted successfully.",
      reference: lead.reference,
    });
  } catch (error) {
    // A duplicate key can occur even if two requests arrive together.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This mobile number has already submitted a request.",
      });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message: "Please check the submitted information and try again.",
      });
    }

    // Keep internal database details out of the public response.
    console.error("Lead submission failed:", error.message);

    return res.status(500).json({
      message: "Unable to submit your request right now.",
    });
  }
});

export default router;

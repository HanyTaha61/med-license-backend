import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    normalizedPhone: {
      type: String,
      required: true,
    },

    profession: {
      type: String,
      required: true,
      enum: ["doctor", "nurse"],
    },

    specialty: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    targetCountry: {
      type: String,
      required: true,
      enum: ["saudi-arabia", "qatar", "uae", "oman", "bahrain", "kuwait"],
    },

    serviceType: {
      type: String,
      required: true,
      enum: ["dataflow", "licensing-exam", "professional-licensing"],
    },

    preferredContactTime: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    consentToShare: {
      type: Boolean,
      required: true,
      validate: (value) => value === true,
    },

    consentAt: {
      type: Date,
      required: true,
    },

    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "website",
    },

    campaign: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "closed",
        "duplicate",
      ],
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One enquiry per normalized phone number.
leadSchema.index(
  { normalizedPhone: 1 },
  { unique: true, name: "normalizedPhone_1" },
);

// Newest enquiries first.
leadSchema.index({ createdAt: -1 }, { name: "createdAt_-1" });

export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

import mongoose from "mongoose";

/**
 * Event Model - Glow Ritual Events
 * Мероприятия HAORI VISION с перформансами и NFT
 */

const eventSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    tagline: {
      type: String,
    },
    type: {
      type: String,
      enum: ["ritual", "exhibition", "workshop", "launch", "private"],
      default: "ritual",
    },
    status: {
      type: String,
      enum: ["draft", "announced", "happening", "completed", "cancelled"],
      default: "draft",
    },
    venue: {
      name: String,
      address: String,
      city: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      capacity: Number,
    },
    dates: {
      announced: Date,
      start: {
        type: Date,
        required: true,
      },
      end: Date,
      doors: Date,
      ritual: Date,
    },
    performance: {
      scenario: {
        phase1: {
          name: String,
          duration: Number, // minutes
          description: String,
          lighting: String,
          music: String,
        },
        phase2: {
          name: String,
          duration: Number,
          description: String,
          lighting: String,
          music: String,
        },
        phase3: {
          name: String,
          duration: Number,
          description: String,
          lighting: String,
          music: String,
        },
      },
      totalDuration: Number,
    },
    ambiance: {
      playlist: [
        {
          artist: String,
          track: String,
          spotifyUrl: String,
          phase: String,
        },
      ],
      lighting: {
        daylight: String,
        uv: String,
        blackout: String,
      },
      dress_code: String,
      vibes: [String],
    },
    attendance: {
      capacity: Number,
      registered: { type: Number, default: 0 },
      attended: { type: Number, default: 0 },
      waitlist: { type: Number, default: 0 },
    },
    invitations: [
      {
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
        },
        email: String,
        name: String,
        status: {
          type: String,
          enum: ["invited", "confirmed", "declined", "waitlist", "attended"],
          default: "invited",
        },
        invitedAt: Date,
        respondedAt: Date,
        attendedAt: Date,
        plusOne: Boolean,
        notes: String,
      },
    ],
    nft: {
      enabled: Boolean,
      contractAddress: String,
      collectionName: String,
      description: String,
      baseImageUrl: String,
      minted: { type: Number, default: 0 },
      attendees: [
        {
          clientId: mongoose.Schema.Types.ObjectId,
          walletAddress: String,
          tokenId: String,
          openseaUrl: String,
          mintedAt: Date,
        },
      ],
    },
    media: {
      coverImage: String,
      heroVideo: String,
      gallery: [String],
      livestream: String,
    },
    description: {
      short: String,
      long: String,
      ritual: String,
    },
    links: {
      rsvp: String,
      livestream: String,
      recap: String,
      spotify: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index для быстрого поиска
eventSchema.index({ slug: 1 });
eventSchema.index({ "dates.start": 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ featured: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;

import mongoose from "mongoose";

const savedTrackSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, enum: ["local", "jamendo"], required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  attributionUrl: String,
  licenseUrl: String,
}, { _id: false, strict: "throw" });

const playlistSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  tracks: { type: [savedTrackSchema], default: [] },
}, { timestamps: true, strict: "throw" });

playlistSchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.models.Playlist || mongoose.model("Playlist", playlistSchema);

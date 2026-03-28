const mongoose = require('mongoose');

const etsyOAuthStateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true, index: true },
  codeVerifier: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-delete after 10 min
});

module.exports = mongoose.model('EtsyOAuthState', etsyOAuthStateSchema);

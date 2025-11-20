/**
 * AI Model Model
 */

const mongoose = require('mongoose');

const ModelSchema = new mongoose.Schema({
  modelId: {
    type: String,
    required: [true, 'Model ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Model name is required']
  },
  type: {
    type: String,
    enum: ['base', 'fine-tuned', 'lora'],
    required: true
  },
  baseModel: {
    type: String
  },
  modelPath: {
    type: String,
    required: [true, 'Model path is required']
  },
  status: {
    type: String,
    enum: ['training', 'ready', 'error', 'archived'],
    default: 'ready'
  },
  metadata: {
    description: String,
    size: String,
    parameters: String,
    trainingData: String,
    trainingDuration: Number,
    accuracy: Number,
    loss: Number
  },
  trainingConfig: {
    type: mongoose.Schema.Types.Mixed
  },
  usage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    averageLatency: {
      type: Number,
      default: 0
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
ModelSchema.index({ type: 1, status: 1 });
ModelSchema.index({ createdBy: 1 });

// Methods
ModelSchema.methods.incrementUsage = function(tokens, latency) {
  this.usage.totalRequests += 1;
  this.usage.totalTokens += tokens;
  
  // Update average latency
  const total = this.usage.averageLatency * (this.usage.totalRequests - 1) + latency;
  this.usage.averageLatency = total / this.usage.totalRequests;
  
  return this.save();
};

module.exports = mongoose.model('Model', ModelSchema);


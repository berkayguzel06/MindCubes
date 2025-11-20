/**
 * Task Model
 */

const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Task description is required']
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Agent is required']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  outputData: {
    type: mongoose.Schema.Types.Mixed
  },
  errorMessage: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number  // in milliseconds
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
TaskSchema.index({ agent: 1, status: 1 });
TaskSchema.index({ status: 1, priority: -1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ createdAt: -1 });

// Methods
TaskSchema.methods.start = function() {
  this.status = 'in_progress';
  this.startedAt = new Date();
  return this.save();
};

TaskSchema.methods.complete = function(outputData) {
  this.status = 'completed';
  this.outputData = outputData;
  this.completedAt = new Date();
  if (this.startedAt) {
    this.duration = this.completedAt - this.startedAt;
  }
  return this.save();
};

TaskSchema.methods.fail = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.completedAt = new Date();
  if (this.startedAt) {
    this.duration = this.completedAt - this.startedAt;
  }
  return this.save();
};

TaskSchema.methods.retry = function() {
  if (this.retryCount < this.maxRetries) {
    this.retryCount += 1;
    this.status = 'pending';
    this.errorMessage = null;
    return this.save();
  }
  throw new Error('Max retries exceeded');
};

module.exports = mongoose.model('Task', TaskSchema);


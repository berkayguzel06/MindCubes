/**
 * Agent Model
 */

const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Agent type is required'],
    enum: ['CodeAgent', 'DataAnalysisAgent', 'ResearchAgent', 'TaskPlannerAgent', 'Custom']
  },
  description: {
    type: String,
    required: [true, 'Agent description is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  configuration: {
    llmProvider: {
      type: String,
      enum: ['openai', 'anthropic', 'local'],
      default: 'openai'
    },
    modelName: {
      type: String,
      default: 'gpt-4'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 2000
    }
  },
  tools: [{
    name: String,
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  stats: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    failedTasks: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
AgentSchema.index({ type: 1 });
AgentSchema.index({ status: 1 });

// Virtual for success rate
AgentSchema.virtual('successRate').get(function() {
  if (this.stats.totalTasks === 0) return 0;
  return (this.stats.completedTasks / this.stats.totalTasks) * 100;
});

// Methods
AgentSchema.methods.incrementTaskStats = function(success, responseTime) {
  this.stats.totalTasks += 1;
  if (success) {
    this.stats.completedTasks += 1;
  } else {
    this.stats.failedTasks += 1;
  }
  
  // Update average response time
  const total = this.stats.averageResponseTime * (this.stats.totalTasks - 1) + responseTime;
  this.stats.averageResponseTime = total / this.stats.totalTasks;
  
  return this.save();
};

module.exports = mongoose.model('Agent', AgentSchema);


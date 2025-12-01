/**
 * Chat Controller
 * Handles chat messages and history management
 */

const axios = require('axios');
const chatHistoryService = require('../services/chatHistoryService');
const logger = require('../config/logger');

// AI Engine URL
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

/**
 * Send message to AI and get response
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mesaj boş olamaz',
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli',
      });
    }

    // Get or create session
    const currentSessionId = await chatHistoryService.getOrCreateSession(userId, sessionId);

    // Get chat history for context
    const history = await chatHistoryService.getSessionHistory(userId, currentSessionId, 20);
    const formattedHistory = chatHistoryService.formatHistoryForLLM(history, 10);

    // Save user message to history
    await chatHistoryService.saveMessage(userId, currentSessionId, 'user', message.trim());

    // AI Engine'e mesaj gönder
    const response = await axios.post(`${AI_ENGINE_URL}/api/chat`, {
      message: message.trim(),
      history: formattedHistory,
      userId,
      sessionId: currentSessionId,
      use_master_agent: true,
      metadata: {
        username: req.user?.username,
        timestamp: new Date().toISOString(),
      },
    }, {
      timeout: 120000, // 2 dakika timeout
    });

    const aiResponse = response.data.response || response.data.message;

    // Save AI response to history
    await chatHistoryService.saveMessage(userId, currentSessionId, 'assistant', aiResponse, {
      agent: response.data.metadata?.agent,
      workflow_triggered: response.data.metadata?.workflow_triggered
    });

    return res.status(200).json({
      success: true,
      response: aiResponse,
      sessionId: currentSessionId,
      metadata: response.data.metadata,
    });

  } catch (error) {
    logger.error(`Chat error: ${error.message}`);
    
    // AI Engine'e bağlanılamadıysa
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        message: 'AI servisi şu anda kullanılamıyor',
        error: 'AI Engine connection failed',
      });
    }

    // Timeout hatası
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI yanıt vermekte gecikti, lütfen tekrar deneyin',
        error: 'Request timeout',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken bir hata oluştu',
      error: error.message,
    });
  }
};

/**
 * Get chat history for current session
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const sessionId = req.query.sessionId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli',
      });
    }

    let history;
    if (sessionId) {
      history = await chatHistoryService.getSessionHistory(userId, sessionId, 50);
    } else {
      history = await chatHistoryService.getRecentHistory(userId, 50);
    }

    return res.status(200).json({
      success: true,
      data: history,
      sessionId: sessionId || null,
    });
  } catch (error) {
    logger.error(`Get history error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Geçmiş alınırken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * Get all chat sessions for user
 */
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli',
      });
    }

    const sessions = await chatHistoryService.getUserSessions(userId, 20);

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    logger.error(`Get sessions error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Oturumlar alınırken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * Clear chat history for session
 */
exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const sessionId = req.body.sessionId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli',
      });
    }

    if (sessionId) {
      await chatHistoryService.clearSessionHistory(userId, sessionId);
    } else {
      await chatHistoryService.clearUserHistory(userId);
    }

    return res.status(200).json({
      success: true,
      message: 'Geçmiş temizlendi',
    });
  } catch (error) {
    logger.error(`Clear history error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Geçmiş temizlenirken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * Create new chat session
 */
exports.createSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gerekli',
      });
    }

    const sessionId = await chatHistoryService.getOrCreateSession(userId);

    return res.status(200).json({
      success: true,
      sessionId,
    });
  } catch (error) {
    logger.error(`Create session error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Oturum oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

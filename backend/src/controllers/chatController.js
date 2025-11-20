/**
 * Chat Controller
 */

const axios = require('axios');

// AI Engine URL (config'den alınabilir)
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

/**
 * Send message to AI and get response
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mesaj boş olamaz',
      });
    }

    // AI Engine'e mesaj gönder
    const response = await axios.post(`${AI_ENGINE_URL}/api/chat`, {
      message: message.trim(),
      history: history || [],
      userId,
      metadata: {
        username: req.user.username,
        timestamp: new Date(),
      },
    }, {
      timeout: 30000, // 30 saniye timeout
    });

    return res.status(200).json({
      success: true,
      message: response.data.response || response.data.message,
      data: response.data,
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    
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
 * Get chat history (if we store it in database)
 */
exports.getHistory = async (req, res) => {
  try {
    // TODO: Database'den chat geçmişini çek
    // Şimdilik boş array dönüyoruz
    return res.status(200).json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Geçmiş alınırken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * Clear chat history
 */
exports.clearHistory = async (req, res) => {
  try {
    // TODO: Database'den kullanıcının chat geçmişini sil
    return res.status(200).json({
      success: true,
      message: 'Geçmiş temizlendi',
    });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Geçmiş temizlenirken hata oluştu',
      error: error.message,
    });
  }
};


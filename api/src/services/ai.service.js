const geminiService = require("./ai_providers/gemini.service");
const Learning = require("../models/learning.model");

const formatConversation = (ticket) => {
  return ticket.messages
    .map((msg) => {
      const senderRole = msg.senderType === "user" ? "کاربر" : "اپراتور";
      return `${senderRole}: ${msg.content}`;
    })
    .join("\n");
};

const getSummary = async (ticket) => {
  const conversationText = formatConversation(ticket);
  const prompt = `
        وظیفه شما فقط خلاصه‌سازی مکالمه زیر به زبان فارسی برای یک اپراتور پشتیبانی است.
        خلاصه باید حداکثر دو جمله و بسیار کاربردی باشد.
        ---
        مکالمه:
        ${conversationText}
    `;
  return geminiService.generateText(prompt);
};

const getSuggestions = async (ticket) => {
  const conversationText = formatConversation(ticket);
  const pastSolutions = await Learning.find({
    department: ticket.department._id,
  })
    .limit(10)
    .sort({ createdAt: -1 });

  const formattedSolutions = pastSolutions
    .map(
      (sol) =>
        `خلاصه: ${sol.ticketSummary}\nپاسخ: ${sol.successfulReply}`
    )
    .join("\n---\n");

  const prompt = `
        شما یک دستیار هوش مصنوعی برای اپراتورهای پشتیبانی هستید.
        بر اساس مکالمه فعلی و با توجه به راه حل‌های موفق قبلی، ۳ پاسخ پیشنهادی کوتاه و مفید به زبان فارسی برای اپراتور بنویس.
        پاسخ‌ها باید به صورت یک لیست شماره‌گذاری شده باشند.
        ---
        راه حل‌های قبلی:
        ${formattedSolutions}
        ---
        مکالمه جدید:
        ${conversationText}
        ---
        پاسخ‌های پیشنهادی:
    `;

  const responseText = await geminiService.generateText(prompt);

  return responseText
    .split("\n")
    .map((line) => line.replace(/^\d+[\.\-]\s*/, "").trim())
    .filter((line) => line);
};

const getInitialAnswer = async (ticket, department) => {
  const userMessage = ticket.messages[0].content;
  const faqsKnowledge = department.faqs
    .map(
      (faq) =>
        `سوال متداول: ${faq.question}\nپاسخ آن: ${faq.answer}`
    )
    .join("\n\n");

  const knowledgeBase = `${department.knowledgeBaseText || ""}\n\n${faqsKnowledge}`;

  // --- FINAL, MOST RELIABLE PROMPT ---
  const prompt = `
    **شخصیت شما:** تو یک ربات پشتیبانی بسیار دقیق و خوش‌برخورد به نام "هوش مصنوعی آکادمی زبان آفاق" هستی. تو **برای کاربر** می‌نویسی، نه برای کارمند.

    **وظیفه اصلی:** به "سوال کاربر" فقط و فقط بر اساس "دانش‌نامه" پاسخ بده.

    **دستورالعمل قطعی:**
    1. اولش بنویس سلام! من هوش منصنوعی آکادمی زبان آفاق هستم. سعی میکنم قبل از اینکه به پشتیبان وصل شی جوابتو بدم که معطل نشی. اگر جوابتو نگرفتی روی دکمه بزن که به اوپراتور ها وصل شی. بعد برو خط بعدی و جواب سوال کاربر رو با لحن گرم بده .اگر پاسخ سوال کاربر در "دانش‌نامه" وجود دارد، آن را به صورت یک **پاسخ مستقیم و کامل** به زبان فارسی برای کاربر بنویس.
    2. اگر پاسخ در "دانش‌نامه" وجود **ندارد**، باید **دقیقاً و فقط** این جمله را خروجی دهی: " ! سوال شما برای بررسی توسط کارشناسان ما ثبت شد و به زودی پاسخگو خواهند بود."

    **قوانین مطلق:**
    - هرگز نگو "کاربر سوال پرسیده..." یا "پاسخ این است...". مستقیماً خود پاسخ را بنویس.
    - هرگز سوال را خلاصه نکن.

    --- دانش‌نامه ---
    ${knowledgeBase.trim()}
    -----------------

    --- سوال کاربر ---
    ${userMessage}
    -------------------

    **پاسخ شما به کاربر:**
  `;

  return geminiService.generateText(prompt);
};

module.exports = {
  getSummary,
  getSuggestions,
  getInitialAnswer,
};

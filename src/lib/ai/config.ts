export const AI_CONFIG = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_BACKUP_KEYS: [
    process.env.GROQ_BACKUP_KEY_1,
    process.env.GROQ_BACKUP_KEY_2,
    process.env.GROQ_BACKUP_KEY_3,
    process.env.GROQ_BACKUP_KEY_4,
    process.env.GROQ_BACKUP_KEY_5,
    process.env.GROQ_BACKUP_KEY_6,
  ].filter(Boolean) as string[],
  GROQ_MODEL: "groq/compound",
  TIMEOUT_MS: 30000,
};

export function validateConfig() {
  if (!AI_CONFIG.GROQ_API_KEY && (!AI_CONFIG.GROQ_BACKUP_KEYS || AI_CONFIG.GROQ_BACKUP_KEYS.length === 0)) {
    throw new Error("Missing Groq API Keys. Please check your .env.local file.");
  }
  return true;
}

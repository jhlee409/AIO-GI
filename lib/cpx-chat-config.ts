// Includes both reasoning tokens and the patient-facing reply for GPT-6 Luna.
const DEFAULT_CPX_CHAT_MAX_TOKENS = 2048;
const MIN_CPX_CHAT_MAX_TOKENS = 512;
const MAX_CPX_CHAT_MAX_TOKENS = 8192;

function normalizeCpxChatMaxTokens(value: unknown): number | null {
    const maxTokens = Number(value);
    if (
        !Number.isInteger(maxTokens) ||
        maxTokens < MIN_CPX_CHAT_MAX_TOKENS ||
        maxTokens > MAX_CPX_CHAT_MAX_TOKENS
    ) {
        return null;
    }

    return maxTokens;
}

export function getCpxChatMaxTokens(
    env: Record<string, string | undefined> = process.env as Record<string, string | undefined>
): number {
    return normalizeCpxChatMaxTokens(env.CPX_CHAT_MAX_TOKENS) ?? DEFAULT_CPX_CHAT_MAX_TOKENS;
}

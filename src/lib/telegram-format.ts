export function cleanTelegramInput(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const stripped = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;
  return stripped.length > 0 ? stripped : null;
}

export function formatTelegramStatus(telegramId: string | null | undefined): {
  connected: boolean;
  label: string;
} {
  const cleaned = cleanTelegramInput(telegramId);
  if (!cleaned) {
    return {
      connected: false,
      label: "Belum Terhubung",
    };
  }
  const isNumeric = /^\d+$/.test(cleaned);
  return {
    connected: true,
    label: isNumeric ? `Terhubung (ID: ${cleaned})` : `Terhubung (@${cleaned})`,
  };
}

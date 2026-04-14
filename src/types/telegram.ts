export interface TelegramPrefs {
  daily_briefing: boolean;
  price_alerts: boolean;
  mention_alerts: boolean;
}

export type WizardStep = "intro" | "connect" | "preferences";

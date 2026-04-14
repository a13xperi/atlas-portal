// OracleState represents the current state of the Oracle AI system
type OracleState = {
  status: "idle" | "processing" | "error";
  error?: string;
  // Additional fields can be added here as needed
};

// OracleAction is a discriminated union representing various actions the Oracle AI can take
type OracleAction =
  | { type: "initialize"; config: OracleConfig }
  | { type: "processInput"; input: string; context?: string }
  | { type: "updateState"; newState: OracleState }
  | { type: "sendMessage"; message: OracleMessage }
  | { type: "voiceCommand"; command: string; profile: VoiceProfile }
  | { type: "shutdown" };

// OracleConfig contains configuration settings for the Oracle AI system
type OracleConfig = {
  apiKey: string;
  language: string;
  // Add other configuration fields as necessary
};

// VoiceProfile represents the voice profile of a user
type VoiceProfile = {
  userId: string;
  voiceId: string;
  accent?: string;
  language?: string;
  // Add other voice-related fields as necessary
};

// OnboardingStep enum represents the steps in the onboarding process
enum OnboardingStep {
  WELCOME = "welcome",
  SETUP = "setup",
  COMPLETE = "complete",
  ERROR = "error",
}

// OracleMessage represents a message sent by the Oracle AI system
type OracleMessage = {
  id: string;
  content: string;
  timestamp: Date;
  sender: "oracle" | "user";
  // Add other message-related fields as necessary
}

// Export all types for use in other parts of the application
export type {
  OracleState,
  OracleAction,
  OracleConfig,
  VoiceProfile,
  OnboardingStep,
  OracleMessage,
};
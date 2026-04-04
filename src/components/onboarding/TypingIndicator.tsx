"use client";

import { motion } from "framer-motion";
import OracleAvatar from "./OracleAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <OracleAvatar size={36} />
      <div className="rounded-2xl rounded-bl-md bg-glass border border-glass-border px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-atlas-teal"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

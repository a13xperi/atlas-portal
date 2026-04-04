"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import OracleAvatar from "./OracleAvatar";

interface OracleMessageProps {
  role: "oracle" | "user" | "system";
  content: string;
  children?: ReactNode; // inline component slot
}

export default function OracleMessage({
  role,
  content,
  children,
}: OracleMessageProps) {
  if (role === "user") {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-atlas-teal/15 border border-atlas-teal/30 px-4 py-3">
          <p className="text-sm text-atlas-text">{content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <OracleAvatar size={36} />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="rounded-2xl rounded-bl-md bg-glass border border-atlas-teal/20 backdrop-blur-xl px-4 py-3">
          <p className="text-sm text-atlas-text leading-relaxed">{content}</p>
        </div>
        {children && <div className="ml-0">{children}</div>}
      </div>
    </motion.div>
  );
}

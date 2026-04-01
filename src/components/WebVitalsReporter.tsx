"use client";

import { useReportWebVitals } from "next/web-vitals";
import { reportWebVital } from "@/lib/analytics";

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    reportWebVital(metric);
  });

  return null;
}

"use client";

import DimensionBar from "@/components/ui/DimensionBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/lib/tokens";
import {
  formatVoiceDimensionValue,
  pickVoiceDimensions,
  VoiceDimensionField,
  VoiceDimensions,
  VOICE_DIMENSION_SECTIONS,
} from "@/lib/voice-profile-dimensions";

interface VoiceDimensionSectionsProps {
  values?: Partial<VoiceDimensions> | null;
  interactive?: boolean;
  loading?: boolean;
  onChange?: (field: VoiceDimensionField, value: number) => void;
}

export default function VoiceDimensionSections({
  values,
  interactive = false,
  loading = false,
  onChange,
}: VoiceDimensionSectionsProps) {
  const resolvedValues = pickVoiceDimensions(values);

  return (
    <div className="space-y-4">
      {VOICE_DIMENSION_SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        >
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
              {section.title}
            </p>
            <div
              className="mt-2 h-px w-12"
              style={{ backgroundColor: colors.atlasTeal }}
            />
            <p className="mt-3 text-sm text-atlas-text-muted">
              {section.description}
            </p>
          </div>

          <div className="space-y-3">
            {section.dimensions.map((dimension) =>
              loading ? (
                <div key={dimension.field} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ) : (
                <DimensionBar
                  key={dimension.field}
                  label={dimension.label}
                  percentage={resolvedValues[dimension.field] ?? 50}
                  interactive={interactive}
                  onChange={(value) => onChange?.(dimension.field, value)}
                  step={10}
                  valueLabel={formatVoiceDimensionValue(
                    resolvedValues[dimension.field] ?? 50
                  )}
                />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

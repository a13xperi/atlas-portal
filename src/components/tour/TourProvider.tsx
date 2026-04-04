"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDemoMode } from "@/lib/demo-mode";
import { TOUR_STEPS } from "@/lib/tour";
import TourSpotlight from "./TourSpotlight";

interface TourContextValue {
  active: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  active: false,
  currentStep: 0,
  totalSteps: TOUR_STEPS.length,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
});

export function useTour() {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);

  // Check if user needs the tour on mount
  useEffect(() => {
    if (!user || hasChecked) return;
    const u = user as unknown as { tourCompleted?: boolean; tourStep?: number };
    if (u.tourCompleted === false && pathname === "/dashboard") {
      // Small delay so the dashboard renders first
      const t = setTimeout(() => setActive(true), 1500);
      if (typeof u.tourStep === "number" && u.tourStep > 0) {
        setCurrentStep(u.tourStep);
      }
      setHasChecked(true);
      return () => clearTimeout(t);
    }
    setHasChecked(true);
  }, [user, hasChecked, pathname]);

  // Navigate to the correct page when step changes
  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[currentStep];
    if (step && pathname !== step.route) {
      router.push(step.route);
    }
  }, [active, currentStep, pathname, router]);

  // Persist step progress
  useEffect(() => {
    if (!active || !user) return;
    api.users.updateProfile({ tourStep: currentStep }).catch(() => {});
  }, [active, currentStep, user]);

  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const demoWasOff = useRef(false);

  const completeTour = useCallback(() => {
    setActive(false);
    // Restore demo mode if we turned it on for the tour
    if (demoWasOff.current) {
      toggleDemoMode();
      demoWasOff.current = false;
    }
    api.users.updateProfile({ tourCompleted: true, tourStep: TOUR_STEPS.length }).catch(() => {});
  }, [toggleDemoMode]);

  const nextStep = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      completeTour();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const startTour = useCallback(() => {
    // Auto-enable demo mode so every page has data during the tour
    if (!isDemoMode) {
      demoWasOff.current = true;
      toggleDemoMode();
    }
    setCurrentStep(0);
    setActive(true);
  }, [isDemoMode, toggleDemoMode]);

  return (
    <TourContext.Provider
      value={{
        active,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}
      {active ? (
        <TourSpotlight
          step={TOUR_STEPS[currentStep]}
          stepIndex={currentStep}
          totalSteps={TOUR_STEPS.length}
          onNext={nextStep}
          onPrev={currentStep > 0 ? prevStep : undefined}
          onSkip={skipTour}
        />
      ) : null}
    </TourContext.Provider>
  );
}

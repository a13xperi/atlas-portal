"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDemoMode } from "@/lib/demo-mode";
import {
  PAGE_TOURS,
  ROUTE_TO_PAGE,
  TOUR_PAGES,
  isPageTourComplete,
  markPageTourComplete,
  resetAllPageTours,
  type TourPage,
  type TourStep,
} from "@/lib/tour";
import TourSpotlight from "./TourSpotlight";

interface TourContextValue {
  /** Whether a page tour is currently active. */
  active: boolean;
  /** Which page tour is running, if any. */
  activePage: TourPage | null;
  /** Current step index within the active page tour. */
  currentStep: number;
  /** Total steps in the active page tour. */
  totalSteps: number;
  /** Start (or restart) the tour for a specific page. */
  startPageTour: (page: TourPage) => void;
  /** Start the tour for the current page. */
  startTour: () => void;
  /** Advance to the next step. Completes tour on last step. */
  nextStep: () => void;
  /** Go back one step. */
  prevStep: () => void;
  /** Skip / dismiss the active tour. */
  skipTour: () => void;
  /** Reset all page tours so they re-trigger on next visit. */
  resetAllTours: () => void;
  /** Number of pages whose tours are completed. */
  completedPages: number;
  /** Total number of tour pages. */
  totalPages: number;
}

const TourContext = createContext<TourContextValue>({
  active: false,
  activePage: null,
  currentStep: 0,
  totalSteps: 0,
  startPageTour: () => {},
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
  resetAllTours: () => {},
  completedPages: 0,
  totalPages: TOUR_PAGES.length,
});

export function useTour() {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const [activePage, setActivePage] = useState<TourPage | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedPages, setCompletedPages] = useState(0);
  const demoWasOff = useRef(false);
  const autoTriggerRef = useRef<Set<string>>(new Set());

  const active = activePage !== null;
  const steps: TourStep[] = activePage ? PAGE_TOURS[activePage] : [];
  const totalSteps = steps.length;

  // Count completed page tours on mount and after changes
  const refreshCompletedCount = useCallback(() => {
    const count = TOUR_PAGES.filter((p) => isPageTourComplete(p)).length;
    setCompletedPages(count);
  }, []);

  useEffect(() => {
    refreshCompletedCount();
  }, [refreshCompletedCount]);

  // \u2500\u2500 Auto-trigger on first page visit \u2500\u2500
  useEffect(() => {
    if (active || !user) return;
    const page = ROUTE_TO_PAGE[pathname];
    if (!page) return;
    if (isPageTourComplete(page)) return;
    // Only auto-trigger once per page per session
    if (autoTriggerRef.current.has(page)) return;
    autoTriggerRef.current.add(page);

    const t = setTimeout(() => {
      // Re-check: another tour may have started in the meantime
      if (activePage !== null) return;
      setCurrentStep(0);
      setActivePage(page);
      // Enable demo mode for the tour
      if (!isDemoMode) {
        demoWasOff.current = true;
        toggleDemoMode();
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [pathname, active, user, activePage, isDemoMode, toggleDemoMode]);

  // \u2500\u2500 Complete active tour \u2500\u2500
  const completeTour = useCallback(() => {
    if (activePage) {
      markPageTourComplete(activePage);
      refreshCompletedCount();
    }
    setActivePage(null);
    setCurrentStep(0);
    // Restore demo mode
    if (demoWasOff.current) {
      toggleDemoMode();
      demoWasOff.current = false;
    }
    // Sync overall completion to backend if all done
    const allDone = TOUR_PAGES.every((p) => isPageTourComplete(p));
    if (allDone) {
      api.users.updateProfile({ tourCompleted: true }).catch(() => {});
    }
  }, [activePage, toggleDemoMode, refreshCompletedCount]);

  const nextStep = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      completeTour();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalSteps, completeTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const startPageTour = useCallback(
    (page: TourPage) => {
      if (!isDemoMode) {
        demoWasOff.current = true;
        toggleDemoMode();
      }
      setCurrentStep(0);
      setActivePage(page);
    },
    [isDemoMode, toggleDemoMode],
  );

  const startTour = useCallback(() => {
    const page = ROUTE_TO_PAGE[pathname];
    if (!page) return;
    // If all pages are toured, reset everything; otherwise just replay current page
    const allDone = TOUR_PAGES.every((p) => isPageTourComplete(p));
    if (allDone) {
      resetAllPageTours();
      refreshCompletedCount();
      api.users.updateProfile({ tourCompleted: false, tourStep: 0 }).catch(() => {});
      autoTriggerRef.current.clear();
    }
    startPageTour(page);
  }, [pathname, startPageTour, refreshCompletedCount]);

  return (
    <TourContext.Provider
      value={{
        active,
        activePage,
        currentStep,
        totalSteps,
        startPageTour,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        resetAllTours: startTour,
        completedPages,
        totalPages: TOUR_PAGES.length,
      }}
    >
      {children}
      {active && steps[currentStep] ? (
        <TourSpotlight
          step={steps[currentStep]}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={currentStep > 0 ? prevStep : undefined}
          onSkip={skipTour}
        />
      ) : null}
    </TourContext.Provider>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useDemoMode } from "@/lib/demo-mode";
import { resetNavDiscovery } from "@/lib/discovery";
import {
  getAvailableTourSteps,
  isPageTourComplete,
  markPageTourComplete,
  PAGE_TOURS,
  resetAllPageTours,
  ROUTE_TO_PAGE,
  TOUR_PAGES,
  type TourPage,
  type TourStep,
} from "@/lib/tour";
import TourSpotlight from "./TourSpotlight";

interface TourContextValue {
  activePage: TourPage | null;
  currentStep: number;
  totalSteps: number;
  completedPages: number;
  totalPages: number;
  isPageActive: (page: TourPage) => boolean;
  getPageSteps: (page: TourPage) => TourStep[];
  hasTour: (page: TourPage) => boolean;
  startPageTour: (page: TourPage) => boolean;
  dismissPageTour: (page: TourPage) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetAllTours: () => void;
}

const TourContext = createContext<TourContextValue>({
  activePage: null,
  currentStep: 0,
  totalSteps: 0,
  completedPages: 0,
  totalPages: TOUR_PAGES.length,
  isPageActive: () => false,
  getPageSteps: () => [],
  hasTour: () => false,
  startPageTour: () => false,
  dismissPageTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  resetAllTours: () => {},
});

function useTourController() {
  return useContext(TourContext);
}

export function useTour(page: TourPage) {
  const {
    activePage,
    getPageSteps,
    hasTour,
    isPageActive,
    startPageTour,
    dismissPageTour,
  } = useTourController();
  const active = isPageActive(page);
  const steps = getPageSteps(page);

  useEffect(() => {
    if (!hasTour(page) || active || isPageTourComplete(page)) {
      return;
    }

    let attempts = 0;
    let cancelled = false;
    let timeoutId: number | null = null;

    const attemptStart = () => {
      if (cancelled || isPageTourComplete(page)) {
        return;
      }

      if (activePage && activePage !== page) {
        return;
      }

      const started = startPageTour(page);

      if (started || attempts >= 12) {
        return;
      }

      attempts += 1;
      timeoutId = window.setTimeout(attemptStart, 250);
    };

    timeoutId = window.setTimeout(attemptStart, 800);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [active, activePage, hasTour, page, startPageTour]);

  const dismiss = useCallback(() => {
    dismissPageTour(page);
  }, [dismissPageTour, page]);

  const start = useCallback(() => {
    startPageTour(page);
  }, [page, startPageTour]);

  return {
    active,
    steps,
    dismiss,
    start,
  };
}

export function useCurrentPageTour() {
  const pathname = usePathname();
  const page = ROUTE_TO_PAGE[pathname];
  const {
    activePage,
    hasTour,
    startPageTour,
  } = useTourController();

  return useMemo(
    () => ({
      page,
      available: page ? hasTour(page) : false,
      active: page ? activePage === page : false,
      start: () => {
        if (page) {
          startPageTour(page);
        }
      },
    }),
    [activePage, hasTour, page, startPageTour],
  );
}

export function useTourProgress() {
  const { completedPages, totalPages } = useTourController();

  return { completedPages, totalPages };
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { isDemoMode, setDemoModeQuiet } = useDemoMode();
  const [activePage, setActivePage] = useState<TourPage | null>(null);
  const [activeSteps, setActiveSteps] = useState<TourStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedPages, setCompletedPages] = useState(0);
  const demoWasOff = useRef(false);

  const refreshCompletedCount = useCallback(() => {
    const nextCount = TOUR_PAGES.filter((page) => isPageTourComplete(page)).length;
    setCompletedPages(nextCount);
  }, []);

  useEffect(() => {
    refreshCompletedCount();
  }, [refreshCompletedCount]);

  const restoreDemoMode = useCallback(() => {
    if (demoWasOff.current) {
      setDemoModeQuiet(false);
      demoWasOff.current = false;
    }
  }, [setDemoModeQuiet]);

  const clearActiveTour = useCallback(() => {
    setActivePage(null);
    setActiveSteps([]);
    setCurrentStep(0);
    restoreDemoMode();
  }, [restoreDemoMode]);

  const markTourDismissed = useCallback(
    (page: TourPage) => {
      markPageTourComplete(page);
      refreshCompletedCount();
    },
    [refreshCompletedCount],
  );

  const startPageTour = useCallback(
    (page: TourPage) => {
      const nextSteps = getAvailableTourSteps(page);

      if (nextSteps.length === 0) {
        return false;
      }

      if (!isDemoMode) {
        demoWasOff.current = true;
        setDemoModeQuiet(true);
      }

      setCurrentStep(0);
      setActiveSteps(nextSteps);
      setActivePage(page);
      return true;
    },
    [isDemoMode, setDemoModeQuiet],
  );

  const dismissPageTour = useCallback(
    (page: TourPage) => {
      markTourDismissed(page);

      if (activePage === page) {
        clearActiveTour();
      }
    },
    [activePage, clearActiveTour, markTourDismissed],
  );

  const nextStep = useCallback(() => {
    if (!activePage) {
      return;
    }

    if (currentStep >= activeSteps.length - 1) {
      markTourDismissed(activePage);
      clearActiveTour();
      return;
    }

    setCurrentStep((stepIndex) => stepIndex + 1);
  }, [activePage, activeSteps.length, clearActiveTour, currentStep, markTourDismissed]);

  const prevStep = useCallback(() => {
    setCurrentStep((stepIndex) => Math.max(0, stepIndex - 1));
  }, []);

  const resetAllTours = useCallback(() => {
    resetAllPageTours();
    resetNavDiscovery();
    refreshCompletedCount();
  }, [refreshCompletedCount]);

  const value = useMemo<TourContextValue>(
    () => ({
      activePage,
      currentStep,
      totalSteps: activeSteps.length,
      completedPages,
      totalPages: TOUR_PAGES.length,
      isPageActive: (page) => activePage === page,
      getPageSteps: (page) => PAGE_TOURS[page] ?? [],
      hasTour: (page) => (PAGE_TOURS[page] ?? []).length > 0,
      startPageTour,
      dismissPageTour,
      nextStep,
      prevStep,
      resetAllTours,
    }),
    [
      activePage,
      activeSteps.length,
      completedPages,
      currentStep,
      dismissPageTour,
      nextStep,
      prevStep,
      resetAllTours,
      startPageTour,
    ],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {activePage && activeSteps[currentStep] ? (
        <TourSpotlight
          step={activeSteps[currentStep]}
          stepIndex={currentStep}
          totalSteps={activeSteps.length}
          onNext={nextStep}
          onPrev={currentStep > 0 ? prevStep : undefined}
          onSkip={() => dismissPageTour(activePage)}
        />
      ) : null}
    </TourContext.Provider>
  );
}

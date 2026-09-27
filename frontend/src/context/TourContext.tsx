import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { TOUR_STEPS, type TourStep } from "../data/tourSteps";

interface TourContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  startTour: (initialStepIndex?: number) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (index: number) => void;
}

const TourContext = createContext<TourContextType | null>(null);

export interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;

  const navigateToStepRoute = useCallback((step: TourStep) => {
    if (window.location.hash !== step.route) {
      window.location.hash = step.route;
    }
  }, []);

  const startTour = useCallback((initialStepIndex: number = 0) => {
    const validIndex = Math.max(0, Math.min(initialStepIndex, totalSteps - 1));
    setCurrentStepIndex(validIndex);
    setIsTourActive(true);
    navigateToStepRoute(TOUR_STEPS[validIndex]);
  }, [totalSteps, navigateToStepRoute]);

  const endTour = useCallback(() => {
    setIsTourActive(false);
  }, []);

  const jumpToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStepIndex(index);
      navigateToStepRoute(TOUR_STEPS[index]);
    }
  }, [totalSteps, navigateToStepRoute]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      jumpToStep(currentStepIndex + 1);
    } else {
      endTour();
    }
  }, [currentStepIndex, totalSteps, jumpToStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      jumpToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, jumpToStep]);

  // Global keyboard shortcuts while tour is active
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Escape") {
        e.preventDefault();
        endTour();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, nextStep, prevStep, endTour]);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStepIndex,
        currentStep,
        totalSteps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        jumpToStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export function useTour(): TourContextType {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

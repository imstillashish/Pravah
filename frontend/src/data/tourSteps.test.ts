import { TOUR_STEPS, getTourStep, getTotalSteps, getStepByFeatureId } from "./tourSteps";

// Self-contained verification assertion suite for Tour Steps
function runAssertions() {
  if (TOUR_STEPS.length !== 28) {
    throw new Error(`Expected 28 tour steps, got ${TOUR_STEPS.length}`);
  }
  if (getTotalSteps() !== 28) {
    throw new Error(`Expected getTotalSteps() to return 28, got ${getTotalSteps()}`);
  }

  const ids = new Set<string>();
  const featureNumbers = new Set<number>();

  TOUR_STEPS.forEach((step, idx) => {
    if (!step.id) throw new Error(`Step at index ${idx} missing id`);
    if (ids.has(step.id)) throw new Error(`Duplicate step id: ${step.id}`);
    ids.add(step.id);

    if (step.featureNumber <= 0) throw new Error(`Invalid featureNumber for ${step.id}`);
    if (featureNumbers.has(step.featureNumber)) throw new Error(`Duplicate featureNumber: ${step.featureNumber}`);
    featureNumbers.add(step.featureNumber);

    if (!step.title) throw new Error(`Step ${step.id} missing title`);
    if (!step.category) throw new Error(`Step ${step.id} missing category`);
    if (!step.route) throw new Error(`Step ${step.id} missing route`);
    if (!step.selector) throw new Error(`Step ${step.id} missing selector`);
    if (!step.whatYouSee) throw new Error(`Step ${step.id} missing whatYouSee`);
    if (!step.underTheHood) throw new Error(`Step ${step.id} missing underTheHood`);
    if (!step.whyItMatters) throw new Error(`Step ${step.id} missing whyItMatters`);

    if (getTourStep(idx) !== step) throw new Error(`getTourStep(${idx}) mismatch`);
    if (getStepByFeatureId(step.featureNumber) !== step) throw new Error(`getStepByFeatureId(${step.featureNumber}) mismatch`);
  });

  return true;
}

runAssertions();

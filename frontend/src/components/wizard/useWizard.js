import { useCallback, useState } from "react";

/**
 * Owns step state for a multi-step wizard so parents no longer thread
 * step/setStep through props.
 *
 * Returns { step, next, back, goTo, reset, isFirst, isLast } where `step` is a
 * zero-based index. `goTo` is clamped to the valid range; callers gate it to
 * completed steps.
 */
export function useWizard(totalSteps) {
  const [step, setStep] = useState(0);

  const next = useCallback(
    () => setStep((s) => Math.min(s + 1, totalSteps - 1)),
    [totalSteps]
  );
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const goTo = useCallback(
    (index) => setStep((s) => (index >= 0 && index < totalSteps ? index : s)),
    [totalSteps]
  );
  const reset = useCallback(() => setStep(0), []);

  return {
    step,
    next,
    back,
    goTo,
    reset,
    isFirst: step === 0,
    isLast: step === totalSteps - 1,
  };
}

export default useWizard;

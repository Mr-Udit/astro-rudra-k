import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

const EMPTY_COMPLETED_STEPS: number[] = [];

export default function StepIndicator({ steps, currentStep, completedSteps = EMPTY_COMPLETED_STEPS }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#D4A574] to-[#B8860B] -z-10 transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.label} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isCurrent
                    ? 'bg-gradient-to-r from-[#2D1B69] to-[#4A1E8C] text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  isCurrent ? 'text-[#2D1B69] font-semibold' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

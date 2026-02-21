"use client";

import React from "react";

interface StepBarProps {
	currentStep: number;
	totalSteps?: number;
}

export default function StepBar({
	currentStep,
	totalSteps = 4
}: StepBarProps) {
	const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

	return (
		<div className="flex items-center justify-between mb-10 w-full max-w-md mx-auto">
			{steps.map((step, index) => (
				<React.Fragment key={step}>
					
					{/* Step Circle */}
					<div
						className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shrink-0
						${
							step <= currentStep
								? "bg-red-600 text-white"
								: "border-2 border-red-600 bg-white"
						}`}
					>
						{step <= currentStep ? (
							step
						) : (
							<div className="h-3 w-3 rounded-full bg-gray-300" />
						)}
					</div>

					{/* Line */}
					{index !== steps.length - 1 && (
						<div
							className={`flex-1 border-t-2 border-dashed mx-2 transition-all duration-300 min-w-0
							${
								step < currentStep
									? "border-red-600"
									: "border-color-re6"
							}`}
						/>
					)}
				</React.Fragment>
			))}
		</div>
	);
}
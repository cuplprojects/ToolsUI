import React from "react";
import { Progress, Badge } from "antd";

const steps = [
  {
    title: "Data Validation",
    description: "Validating imported data and checking constraints",
    duration: "00:12",
    status: "completed",
  },
  {
    title: "Duplicate Consolidation",
    description: "Resolving duplicates and consolidating data",
    duration: "00:08",
    status: "completed",
  },
  {
    title: "Lot Creation & Envelope Breaking",
    description: "Processing quantities and envelope allocations",
    status: "in-progress",
  },
  {
    title: "Extra Processing",
    description: "Nodal and university extras",
    status: "pending",
  },
  {
    title: "Serial Number Generation",
    description: "Multi-level sorting and numbering",
    status: "pending",
  },
  {
    title: "Box Creation",
    description: "Apply capacity and field triggers",
    status: "pending",
  },
  {
    title: "Final Packaging",
    description: "Generate final packaging results",
    status: "pending",
  },
];

const ProcessingPipeline = () => {
  const currentStep = steps.findIndex(step => step.status === "in-progress") + 1;

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Processing Pipeline</h2>
        <div className="text-sm">
          <span>Status: </span>
          <Badge status="processing" text="Processing" />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium mb-1">Overall Progress</p>
        <Progress
          percent={(currentStep / steps.length) * 100}
          showInfo={false}
        />
        <div className="text-right text-sm mt-1">
          Step {currentStep} of {steps.length}
        </div>
      </div>

      <ul className="space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start space-x-2">
            <div className="w-5 flex justify-center">
              {step.status === "completed" ? (
                <span className="text-green-500">✔</span>
              ) : step.status === "in-progress" ? (
                <span className="text-blue-500">⏳</span>
              ) : (
                <span className="text-gray-400">{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{step.title}</p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {step.duration && (
              <div className="text-xs text-gray-400">{step.duration}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProcessingPipeline;

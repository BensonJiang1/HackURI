"use client";

import { useState } from "react";
// Placeholder imports — will be real components later
// import HomeTab from "@/components/HomeTab";
// import WorkTab from "@/components/WorkTab";
// import AmenitiesTab from "@/components/AmenitiesTab";
// import ScoreDisplay from "@/components/ScoreDisplay";

type Tab = "home" | "work" | "amenities";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const tabs: { key: Tab; label: string }[] = [
    { key: "home", label: "Home Location" },
    { key: "work", label: "Work Location" },
    { key: "amenities", label: "Amenities" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">WalkScore</h1>
      <p className="mb-8 text-gray-600">
        Find a home that keeps you active. Enter your home, work, and favourite
        amenities to see how much exercise you&apos;ll get just by walking.
      </p>

      {/* ---- Tab navigation ---- */}
      <div className="mb-6 flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 font-medium ${
              activeTab === t.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- Tab content (placeholder) ---- */}
      <div className="min-h-[400px] rounded-lg border p-6">
        {activeTab === "home" && (
          <p className="text-gray-400">
            [HomeTab placeholder — address input + map picker]
          </p>
        )}
        {activeTab === "work" && (
          <p className="text-gray-400">
            [WorkTab placeholder — address input + map picker]
          </p>
        )}
        {activeTab === "amenities" && (
          <p className="text-gray-400">
            [AmenitiesTab placeholder — multi-select amenity types]
          </p>
        )}
      </div>

      {/* ---- Score display (placeholder) ---- */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-6 text-center">
        <p className="text-gray-400">
          [ScoreDisplay placeholder — weekly walk minutes, calories, grade]
        </p>
      </div>
    </main>
  );
}

"use client";

import DayView from "@/components/DayView";
import { tomorrowPlan } from "@/lib/api";
import { isoDate } from "@/lib/labels";

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

export default function TomorrowPage() {
  return <DayView label="Tomorrow" date={tomorrow()} load={tomorrowPlan} />;
}

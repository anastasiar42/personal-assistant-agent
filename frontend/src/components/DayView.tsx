"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ItemRow from "@/components/ItemRow";
import Nav from "@/components/Nav";
import Outcome from "@/components/Outcome";
import Skeleton from "@/components/Skeleton";
import { usePlanLoader } from "@/components/usePlanLoader";
import { api, patchItem, Plan, PlanItem } from "@/lib/api";
import { clockAt, hhmm, KIND_LABEL, longDate, minutesOf, offsetMinutes, timed } from "@/lib/labels";

type Props = { label: "Today" | "Tomorrow"; date: string; load: () => Promise<Plan | null> };

export default function DayView({ label, date, load }: Props) {
  const { plan, setPlan, loaded, error, setError } = usePlanLoader(load);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  async function outcome(item: PlanItem, value: PlanItem["outcome"]) {
    try {
      setPlan(await patchItem(plan!.id, item.id, { outcome: value }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    if (!plan || !["gathering", "planning"].includes(plan.status)) return;
    const t = setTimeout(() => load().then(setPlan).catch((e) => setError(e.message)), 1200);
    return () => clearTimeout(t);
  }, [plan, load, setPlan, setError]);

  async function planTomorrow() {
    try {
      setPlan(await api<Plan>("/plans", { method: "POST" }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const ready = plan?.status === "ready";
  const blocks = plan ? timed(plan.items) : [];
  // Plan times carry the user's configured timezone offset; the device clock may be elsewhere.
  const offset = blocks[0]?.start ? offsetMinutes(blocks[0].start) : -new Date(now).getTimezoneOffset();
  const clock = clockAt(offset, now);
  const today = plan ? plan.date === clock.date : false;
  const live = today ? clock.minutes : -1;
  const upcoming = blocks.filter((i) => minutesOf(i.end!) > live && (i.kind === "meeting" || !i.outcome));
  const earlier = blocks.filter((i) => !upcoming.includes(i));
  const focus = upcoming[0];
  const later = upcoming.slice(1);
  const work = blocks.filter((i) => i.kind !== "meeting");
  const done = work.filter((i) => i.outcome === "done").length;

  return (
    <>
      <Nav />
      <main className="page today">
        <header className="day-head">
          <h1>{label}</h1>
          <p className="muted">
            {longDate(plan?.date ?? date)}
              {ready && work.length > 0 && `, ${done} of ${work.length} done`}
            </p>
        </header>
        {error && <p className="error">{error}</p>}
        {!loaded && <Skeleton />}

        {loaded && !plan && (
          <section className="sheet empty">
            {label === "Today" ? (
              <>
                <h2>Nothing planned for today</h2>
                <p className="muted">
                  Plans are made the evening before. Plan the next day in <Link href="/tomorrow">Tomorrow</Link>.
                </p>
              </>
            ) : (
              <>
                <h2>Tomorrow isn&apos;t planned yet</h2>
                <p className="muted">
                  Plan it from your messages, calendar and health data. It takes about a minute.
                </p>
                <button className="primary" onClick={planTomorrow}>
                  Plan tomorrow
                </button>
              </>
            )}
          </section>
        )}

        {plan && !ready && (
          <section className="sheet empty">
            <h2>{plan.status === "failed" ? "Planning failed" : "Your plan is being prepared"}</h2>
            <p className="muted">
              Follow it in <Link href="/plan">Week</Link>.
            </p>
          </section>
        )}

        {ready && (
          <>
            {focus ? (
              <article className={`now sheet ${focus.kind}`}>
                <p className="now-when">
                  <span className="fig">{hhmm(focus.start)}</span>
                  {live >= minutesOf(focus.start!) ? "Now" : "Next"}, {focus.duration_min} min
                </p>
                <h2>{focus.title}</h2>
                <p className="muted">{focus.reason || KIND_LABEL[focus.kind]}</p>
                {focus.source_link && (
                  <a href={focus.source_link} target="_blank" rel="noreferrer">
                    Open the message
                  </a>
                )}
                {focus.kind !== "meeting" && <Outcome item={focus} onOutcome={outcome} large />}
              </article>
            ) : (
              <article className="now sheet">
                <h2>That&apos;s the day.</h2>
                <p className="muted">
                  Everything is done or past. <Link href={`/review?plan=${plan.id}`}>Wrap up the day</Link>.
                </p>
              </article>
            )}

            {later.length > 0 && (
              <section>
                <h3 className="list-head">Later</h3>
                <ol className="list">
                  {later.map((i) => (
                    <ItemRow key={i.id} item={i} onOutcome={outcome} />
                  ))}
                </ol>
              </section>
            )}

            {earlier.length > 0 && (
              <details className="earlier">
                <summary>Earlier ({earlier.length})</summary>
                <ol className="list">
                  {earlier.map((i) => (
                    <ItemRow key={i.id} item={i} onOutcome={outcome} />
                  ))}
                </ol>
              </details>
            )}
          </>
        )}
      </main>
    </>
  );
}

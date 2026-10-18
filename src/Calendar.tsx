import { useRef, useState } from "react";
import Header from "./Header";
import lessons from "./calendar.json";

const months = [
  { y: 2026, m: 9 },
  { y: 2026, m: 10 },
  { y: 2026, m: 11 },
  { y: 2026, m: 12 },
  { y: 2027, m: 1 },
];
const weeks = [...new Set(lessons.map((l) => l.week))];
export default function Calendar() {
  const refs = useRef<(HTMLElement | null)[]>([]),
    [selected, setSelected] = useState(-1);
  function jump(i: number) {
    setSelected(i);
    refs.current[i]?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    refs.current[i]?.focus({ preventScroll: true });
  }
  return (
    <>
      <Header />
      <main className="calendar-page">
        <h1>教学日历</h1>
        <p className="lead">
          {lessons.length} 次课 · {lessons.reduce((sum, l) => sum + l.hours, 0)} 学时 ·
          从振动规律走向海洋声学应用
        </p>
        <section className="semester-overview" aria-label="学期月历总览">
          <div className="semester-heading">
            <h2>学期总览</h2>
            <span>
              <i /> 上课日期 · 点击查看课程
            </span>
          </div>
          <div className="month-grid">
            {months.map(({ y, m }) => {
              const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7,
                days = new Date(y, m, 0).getDate();
              return (
                <section className="month" key={m}>
                  <h3>
                    {y} <b>{String(m).padStart(2, "0")}</b> 月
                  </h3>
                  <div className="month-days">
                    {"一二三四五六日".split("").map((d) => (
                      <span className="weekday" key={d}>
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: offset }, (_, i) => (
                      <span key={"blank" + i} />
                    ))}
                    {Array.from({ length: days }, (_, d) => {
                      const day = d + 1,
                        index = lessons.findIndex((l) => l.date === `${y}.${m}.${day}`);
                      return index < 0 ? (
                        <span key={day} className="day">
                          {day}
                        </span>
                      ) : (
                        <button
                          className={"class-day " + (selected === index ? "picked" : "")}
                          key={day}
                          onClick={() => jump(index)}
                          aria-label={`${m}月${day}日 第${index + 1}次课 ${lessons[index].title.split("；")[0]}`}
                          title={lessons[index].title}
                        >
                          {day}
                          <i />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
        <div className="schedule-heading">
          <h2>每周学习安排</h2>
          <span>课前预习 → 课堂实验 → 课后解释</span>
        </div>
        {weeks.map((week) => (
          <section className="week-block" key={week}>
            <div className="week-marker">
              <strong>{String(week).padStart(2, "0")}</strong>
              <small>第 {week} 周</small>
            </div>
            <div className="week-lessons">
              {lessons.map((l, i) =>
                l.week !== week ? null : (
                  <article
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    tabIndex={-1}
                    className={"calendar-item " + (selected === i ? "lesson-picked" : "")}
                    key={l.date}
                  >
                    <div>
                      <time>{l.date}</time>
                    </div>
                    <h3>
                      第 {l.number} 次　{l.title}
                    </h3>
                    <ul>
                      {l.sections.map((section) => (
                        <li key={section.id}>
                          <a href={`#/lab?topic=${section.id}`}>
                            {section.id} {section.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p>
                      <strong>课堂讨论：</strong>
                      {l.discussion}
                    </p>
                    <details>
                      <summary>学习目标与课后任务</summary>

                      <ul>
                        {l.goals.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                      <p>
                        <strong>课后任务：</strong>
                        {l.homework}
                      </p>
                      <p>
                        <strong>教学安排备注：</strong>
                        {l.extension}
                      </p>
                      {l.preview && (
                        <p>
                          <strong>下次课预习：</strong>
                          {l.preview}
                        </p>
                      )}
                    </details>
                  </article>
                ),
              )}
            </div>
          </section>
        ))}
        <footer>
          <a href="mailto:tangshengyu@ouc.edu.cn">课程交流：tangshengyu@ouc.edu.cn</a>
        </footer>
      </main>
    </>
  );
}

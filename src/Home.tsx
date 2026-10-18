import topics from "./topics.json";
import calendar from "./calendar.json";
import Header from "./Header";
import { chapters } from "./catalog";
import { p1Lectures } from "./content/p1Registry";
function Thumbnail({ id }: { id: string }) {
  if (id !== "1.2.4" && id !== "1.2.5" && !p1Lectures.some((l) => l.id === id)) return null;
  return (
    <img
      className="lecture-thumbnail"
      width="68"
      height="34"
      loading="lazy"
      src={`${import.meta.env.BASE_URL}thumbnails/${id}.svg`}
      alt=""
    />
  );
}
export default function Home() {
  const now = new Date(),
    day = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    monday = new Date(day);
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  const end = new Date(monday);
  end.setDate(end.getDate() + 7);
  const week = calendar.filter((l) => {
    const [y, m, d] = l.date.split(".").map(Number),
      date = new Date(y, m - 1, d);
    return date >= monday && date < end;
  });
  return (
    <>
      <Header />
      <main className="course-home">
        <h1>声学基础</h1>
        <p className="course-introduction">
          本课程从集中参数振动出发，学习声波的传播、辐射、散射、接收与吸收。通过数学建模、图形观察和工程计算，理解声学量之间的联系。各讲按教材编号组织，配有慕课课件索引、原理说明、交互演示和思考题。学习时请先阅读原理，再改变参数检验自己的判断。
        </p>
        <section>
          <h2>课程导引</h2>
          <p>
            声在国民生产和生活中的应用：水下探测、噪声控制、超声检测与音乐。学习本课程需要微积分、复数与普通物理基础；推导时先写清假设、边界条件与量纲，计算后再作工程判断。
          </p>
          <p>
            <a href="#/lab?topic=3.1.1">从“什么是声”开始</a> · <a href="#/map">课程知识导图</a> ·{" "}
            <a href="#/compare">对照实验</a>
          </p>
        </section>
        <section>
          <h2>章节目录</h2>
          <table className="course-catalog">
            <thead>
              <tr>
                <th>章</th>
                <th>讲次与代表图</th>
              </tr>
            </thead>
            <tbody>
              {chapters.slice(1).map((chapter, i) => (
                <tr key={chapter}>
                  <th scope="row">
                    {i < 7 ? `第 ${i + 1} 章` : "拓展"}
                    <br />
                    {chapter}
                  </th>
                  <td>
                    <ul>
                      {topics
                        .filter((t) => t.chapter === i + 1)
                        .map((t) => (
                          <li key={t.id}>
                            <a href={`#/lab?topic=${t.id}`}>
                              <Thumbnail id={t.id} />
                              <span>
                                {t.id}　{t.title}
                              </span>
                            </a>
                          </li>
                        ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2>本周课程</h2>
          {week.length ? (
            week.map((l) => (
              <article key={l.date}>
                <h3>
                  {l.date} · 第 {l.week} 周
                </h3>
                <p>{l.title}</p>
                <p>{l.goals.join("；")}</p>
                <p>
                  {l.experiments.map((id) => (
                    <a key={id} href={`#/lab?topic=${id}`}>
                      第 {id} 讲　
                    </a>
                  ))}
                </p>
              </article>
            ))
          ) : (
            <p>
              本周教学日历未安排课程。<a href="#/calendar">查看全学期安排</a>。
            </p>
          )}
        </section>
        <section>
          <h2>任课教师</h2>
          <p>
            唐胜雨 · 中国海洋大学信息学部电子工程学院
            <br />
            <a href="#/about">教师主页</a> ·{" "}
            <a href="mailto:tangshengyu@ouc.edu.cn">tangshengyu@ouc.edu.cn</a>
          </p>
        </section>
      </main>
      <footer className="site-footer">声学基础 · 中国海洋大学</footer>
    </>
  );
}

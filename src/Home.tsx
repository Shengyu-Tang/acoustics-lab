import catalog from "./content/homeCatalog.json";
import Header from "./Header";
import { chapters } from "./catalog";
const { topics, completed } = catalog;
function Thumbnail({ id }: { id: string }) {
  if (!completed.includes(id)) return null;
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
  return (
    <>
      <Header />
      <main className="course-home">
        <h1>声学基础</h1>
        <p className="course-introduction">
          本课程从集中参数振动出发，学习声波的传播、辐射、散射、接收与吸收。各讲按教材编号组织，配有慕课课件索引、原理说明、交互演示和思考题。
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
          <h2>任课教师</h2>
          <p>
            唐胜雨 · 中国海洋大学信息学部电子工程学院
            <br />
            <a href="#/about">教师主页</a> ·{" "}
            <a href="mailto:tangshengyu@ouc.edu.cn">tangshengyu@ouc.edu.cn</a>
          </p>
        </section>
      </main>
    </>
  );
}

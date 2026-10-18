import Header from "./Header";
export default function Feedback() {
  return (
    <>
      <Header />
      <main className="feedback-page">
        <h1>建议与反馈</h1>
        <section>
          <h2>课程联系</h2>
          <p>学习中的疑问、仿真结果或网站使用问题，请发邮件给任课教师唐胜雨。</p>
          <p>
            <a href="mailto:tangshengyu@ouc.edu.cn?subject=声学基础课程反馈">
              tangshengyu@ouc.edu.cn
            </a>
          </p>
        </section>
        <section>
          <h2>反馈内容</h2>
          <p>
            请附上讲次编号、页面链接、使用设备和问题出现时的参数。若是计算结果有疑问，请写明已知条件和你的计算过程，便于核对。
          </p>
        </section>
        <section>
          <h2>相关页面</h2>
          <ul>
            <li>
              <a href="#/calendar">教学日历</a>
            </li>
            <li>
              <a href="#/about">教师主页</a>
            </li>
            <li>
              <a href="#/">课程章节</a>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}

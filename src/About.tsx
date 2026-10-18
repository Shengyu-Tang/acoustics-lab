import Header from "./Header";
import portrait from "./profile-photo.jpg";
export default function About() {
  return (
    <>
      <Header />
      <main className="about">
        <h1>教师主页</h1>
        <section className="teacher-profile">
          <img src={portrait} alt="唐胜雨在湖边长椅上的生活照" width="390" height="520" />
          <div>
            <h2>唐胜雨</h2>
            <p>中国海洋大学信息学部电子工程学院，《声学基础》任课教师。</p>
            <p>
              课程以振动、传播、辐射、散射、接收与吸收为主线，将数学模型与声学工程应用联系起来。
            </p>
            <p>
              <a href="mailto:tangshengyu@ouc.edu.cn">tangshengyu@ouc.edu.cn</a>
            </p>
          </div>
        </section>
        <section>
          <h2>课程信息</h2>
          <dl className="course-facts">
            <div>
              <dt>学分与学时</dt>
              <dd>3 学分，48 学时，24 次课</dd>
            </div>
            <div>
              <dt>面向专业</dt>
              <dd>电子信息工程</dd>
            </div>
            <div>
              <dt>先修课程</dt>
              <dd>高等数学、大学物理、数学物理方法</dd>
            </div>
            <div>
              <dt>课程考核</dt>
              <dd>平时成绩 30%，期末闭卷考试 70%</dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>学习要求</h2>
          <ol>
            <li>写清模型假设、边界条件与量纲，用计算解释声学现象。</li>
            <li>比较频率、尺寸和材料参数对振动与声场的影响。</li>
            <li>根据设计指标选择方案，并说明理想模型的适用范围。</li>
          </ol>
        </section>
        <section>
          <h2>课程资源</h2>
          <ul>
            <li>
              <a href="#/">课程章节</a>
            </li>
            <li>
              <a href="#/calendar">教学日历</a>
            </li>
            <li>
              <a href="#/cases">综合工程案例</a>
            </li>
            <li>
              <a href="#/feedback">建议与反馈</a>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}

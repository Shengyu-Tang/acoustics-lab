import { useState } from "react";
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="brand" href="#/">
        声学基础 · 中国海洋大学
      </a>
      <button
        className="nav-toggle"
        aria-expanded={open}
        aria-label="展开或收起导航"
        onClick={() => setOpen(!open)}
      >
        菜单
      </button>
      <nav className={open ? "nav-open" : ""} aria-label="主导航" onClick={() => setOpen(false)}>
        <a href="#/">课程章节</a>
        <a href="#/cases">综合案例</a>
        <a href="#/calendar">教学日历</a>
        <a href="#/about">教师主页</a>
        <a href="mailto:tangshengyu@ouc.edu.cn">反馈</a>
      </nav>
    </header>
  );
}

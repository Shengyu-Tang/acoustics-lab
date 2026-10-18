const email = "";
export default function Footer() {
  return (
    <footer className="site-footer">
      <span>声学基础</span>
      <span>中国海洋大学信息学部电子工程学院</span>
      <span>任课教师：唐胜雨</span>
      {email && (
        <span>
          联系邮箱：<a href={`mailto:${email}`}>{email}</a>
        </span>
      )}
      <span>© 2026 中国海洋大学</span>
    </footer>
  );
}

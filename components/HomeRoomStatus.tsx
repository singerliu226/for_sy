export function HomeRoomStatus() {
  return (
    <section className="home-room-status" aria-label="小窝近况">
      <a href="/messages">
        <span>想说的时候</span>
        <strong>记一记最近的事儿</strong>
        <small>如果微信和电话没来得及说，这里就是你的留言板。</small>
        <b>去留言 →</b>
      </a>
      <a href="/first-year#little-promises">
        <span>以后想做的</span>
        <strong>我们的小约定</strong>
        <small>约定将来要去做的事儿。</small>
        <b>去约一下 →</b>
      </a>
    </section>
  );
}

"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Person = "思怡" | "魔王";

type Attachment = {
  fileName: string;
  mimeType: string;
};

type BoardMessage = {
  id: string;
  author: Person;
  recipient: Person;
  replyToId?: string;
  body: string;
  createdAt: string;
  image?: Attachment;
  audio?: Attachment;
};

type ThreadItem = {
  message: BoardMessage;
  depth: number;
};

const MESSAGE_LENGTH_LIMIT = 280;
const IMAGE_SIZE_LIMIT = 6 * 1024 * 1024;
const AUDIO_SIZE_LIMIT = 12 * 1024 * 1024;

function fileLabel(file: File | null) {
  if (!file) return "";
  return `${file.name} · ${(file.size / 1024 / 1024).toFixed(file.size > 1024 * 1024 ? 1 : 2)} MB`;
}

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function mediaUrl(attachment: Attachment) {
  return `/api/messages/media/${encodeURIComponent(attachment.fileName)}`;
}

function makeThread(messages: BoardMessage[]) {
  const oldestFirst = [...messages].reverse();
  const knownIds = new Set(oldestFirst.map((message) => message.id));
  const children = new Map<string, BoardMessage[]>();
  const roots: BoardMessage[] = [];

  for (const message of oldestFirst) {
    if (message.replyToId && knownIds.has(message.replyToId)) {
      children.set(message.replyToId, [...(children.get(message.replyToId) ?? []), message]);
    } else {
      roots.push(message);
    }
  }

  const nested: ThreadItem[] = [];
  const visit = (message: BoardMessage, depth: number) => {
    nested.push({ message, depth });
    for (const child of children.get(message.id) ?? []) visit(child, depth + 1);
  };
  for (const message of roots) visit(message, 0);
  return nested;
}

export function MessageBoard() {
  const [messages, setMessages] = useState<BoardMessage[] | null>(null);
  const [author, setAuthor] = useState<Person>("思怡");
  const [replyTo, setReplyTo] = useState<BoardMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAuthor = window.localStorage.getItem("molwan-message-author");
    if (savedAuthor === "思怡" || savedAuthor === "魔王") setAuthor(savedAuthor);
    return () => mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    void fetch("/api/messages", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { messages?: BoardMessage[] };
        if (!response.ok || !Array.isArray(data.messages)) throw new Error("load failed");
        setMessages(data.messages);
      })
      .catch(() => setMessages([]));
  }, []);

  const threadedMessages = useMemo(() => messages ? makeThread(messages) : [], [messages]);

  function chooseAuthor(nextAuthor: Person) {
    setAuthor(nextAuthor);
    window.localStorage.setItem("molwan-message-author", nextAuthor);
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback("这张不是图片，再选一张试试。");
      return;
    }
    if (file.size > IMAGE_SIZE_LIMIT) {
      setFeedback("图片请控制在 6MB 以内。");
      return;
    }
    setImage(file);
    setFeedback("");
  }

  function selectAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setFeedback("这段不是语音文件，再选一段试试。");
      return;
    }
    if (file.size > AUDIO_SIZE_LIMIT) {
      setFeedback("语音请控制在 12MB 以内。");
      return;
    }
    setAudio(file);
    setFeedback("");
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorder.current?.stop();
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setFeedback("当前页面不能直接录音，可以先上传一段语音文件。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunks.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const recorded = new File([new Blob(audioChunks.current, { type })], `我想说-${Date.now()}.webm`, { type });
        if (recorded.size > AUDIO_SIZE_LIMIT) setFeedback("这段录音有点大，控制在 12MB 以内再发吧。");
        else {
          setAudio(recorded);
          setFeedback("录好啦，可以和文字、图片一起发。");
        }
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
      setFeedback("正在录，点一次结束。");
    } catch {
      setFeedback("没拿到麦克风权限，上传语音文件也可以。");
    }
  }

  function replyToMessage(message: BoardMessage) {
    setReplyTo(message);
    setFeedback("");
    window.setTimeout(() => document.getElementById("message-compose")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || (!draft.trim() && !image && !audio)) return;

    setSending(true);
    setFeedback("");
    const form = new FormData();
    form.append("message", draft.trim());
    form.append("website", "");
    form.append("author", author);
    if (replyTo) form.append("replyToId", replyTo.id);
    if (image) form.append("image", image);
    if (audio) form.append("audio", audio);

    try {
      const response = await fetch("/api/messages", { method: "POST", body: form });
      const data = await response.json() as { message?: BoardMessage; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ?? "submit failed");
      setMessages((current) => [data.message!, ...(current ?? [])]);
      setDraft("");
      setReplyTo(null);
      setImage(null);
      setAudio(null);
      if (imageInput.current) imageInput.current.value = "";
      if (audioInput.current) audioInput.current.value = "";
      setFeedback("放进留言里啦。");
    } catch (error) {
      setFeedback(error instanceof Error && error.message ? error.message : "这次没能留住，稍后再试一次。");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="message-board" aria-labelledby="message-board-title">
      <div className="message-board__heading">
        <p>JUST US</p>
        <h2 id="message-board-title">我们的小留言</h2>
      </div>

      <section className="message-board__conversation" aria-label="两个人的留言">
        {messages === null ? <p className="message-board__empty">正在打开留言…</p> : messages.length === 0 ? (
          <p className="message-board__empty">第一句话，留给你们。</p>
        ) : (
          <div className="message-board__thread">
            {threadedMessages.map(({ message, depth }) => (
              <article className={`message-board__note message-board__note--${message.author}`} key={message.id} style={{ "--reply-depth": Math.min(depth, 3) } as CSSProperties}>
                <div className="message-board__note-meta"><span>{message.author}</span><time dateTime={message.createdAt}>{displayTime(message.createdAt)}</time></div>
                {message.body && <p>{message.body}</p>}
                {message.image && <img src={mediaUrl(message.image)} alt={`${message.author}附上的图片`} />}
                {message.audio && <audio controls preload="metadata" src={mediaUrl(message.audio)}>你的浏览器暂时不能播放这段语音。</audio>}
                <button type="button" onClick={() => replyToMessage(message)}>回复</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <form className="message-board__form" id="message-compose" onSubmit={submit}>
        <div className="message-board__form-head">
          <div>
            <p>轮到谁写</p>
            <div className="message-board__identity" role="group" aria-label="选择写信的人">
              {(["思怡", "魔王"] as Person[]).map((person) => <button className={author === person ? "is-active" : ""} key={person} type="button" onClick={() => chooseAuthor(person)}>我是{person}</button>)}
            </div>
          </div>
          {replyTo && <p className="message-board__replying">回复 {replyTo.author} <button type="button" onClick={() => setReplyTo(null)}>取消</button></p>}
        </div>
        <label className="sr-only" htmlFor="board-message">留言内容</label>
        <textarea
          id="board-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MESSAGE_LENGTH_LIMIT}
          placeholder={replyTo ? `想回复${replyTo.author}什么？` : "今天想说什么？"}
          rows={5}
        />

        <div className="message-board__attachments" aria-label="添加图片或语音">
          <div className="message-board__attachment">
            <input ref={imageInput} id="message-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={selectImage} />
            <label htmlFor="message-image">选一张图片</label>
            {image ? <span>{fileLabel(image)} <button type="button" onClick={() => { setImage(null); if (imageInput.current) imageInput.current.value = ""; }}>移除</button></span> : <small>JPG、PNG、WebP、GIF，最多 6MB</small>}
          </div>
          <div className="message-board__attachment">
            <input ref={audioInput} id="message-audio" type="file" accept="audio/webm,audio/mp4,audio/mpeg,audio/wav,audio/ogg" capture onChange={selectAudio} />
            <div className="message-board__audio-actions">
              <label htmlFor="message-audio">上传一段语音</label>
              <button type="button" onClick={toggleRecording}>{recording ? "结束录音" : "按这里录音"}</button>
            </div>
            {audio ? <span>{fileLabel(audio)} <button type="button" onClick={() => { setAudio(null); if (audioInput.current) audioInput.current.value = ""; }}>移除</button></span> : <small>WebM、M4A、MP3、WAV、OGG，最多 12MB</small>}
          </div>
        </div>

        <div className="message-board__form-footer">
          <span>{draft.length}/{MESSAGE_LENGTH_LIMIT}</span>
          <button type="submit" disabled={sending || (!draft.trim() && !image && !audio)}>{sending ? "放进去了…" : "留在这里 →"}</button>
        </div>
        <p className="message-board__feedback" aria-live="polite">{feedback}</p>
      </form>
    </section>
  );
}

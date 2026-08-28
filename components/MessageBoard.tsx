"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

const MESSAGE_LENGTH_LIMIT = 280;
const IMAGE_SIZE_LIMIT = 6 * 1024 * 1024;
const AUDIO_SIZE_LIMIT = 12 * 1024 * 1024;

function fileLabel(file: File | null) {
  if (!file) return "";
  return `${file.name} · ${(file.size / 1024 / 1024).toFixed(file.size > 1024 * 1024 ? 1 : 2)} MB`;
}

export function MessageBoard() {
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

  useEffect(() => () => {
    mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

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
      setFeedback("当前页面不能直接录音，可以先上传一段语音文件。")
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
        if (recorded.size > AUDIO_SIZE_LIMIT) setFeedback("这段录音有点大，控制在 12MB 以内再发吧。")
        else {
          setAudio(recorded);
          setFeedback("录好啦，可以和文字、图片一起发。")
        }
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
      setFeedback("正在录，点一次结束。")
    } catch {
      setFeedback("没拿到麦克风权限，上传语音文件也可以。")
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || (!draft.trim() && !image && !audio)) return;

    setSending(true);
    setFeedback("");
    const form = new FormData();
    form.append("message", draft.trim());
    form.append("website", "");
    if (image) form.append("image", image);
    if (audio) form.append("audio", audio);

    try {
      const response = await fetch("/api/messages", { method: "POST", body: form });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "submit failed");
      setDraft("");
      setImage(null);
      setAudio(null);
      if (imageInput.current) imageInput.current.value = "";
      if (audioInput.current) audioInput.current.value = "";
      setFeedback("送到啦，魔王会在收信看板里看到。")
    } catch (error) {
      setFeedback(error instanceof Error && error.message ? error.message : "这次没能留住，稍后再试一次。")
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="message-board" aria-labelledby="message-board-title">
      <div className="message-board__write">
        <div className="message-board__heading">
          <p>WRITE TO ME</p>
          <h2 id="message-board-title">给魔王留一句话</h2>
        </div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="board-message">留言内容</label>
          <textarea
            id="board-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MESSAGE_LENGTH_LIMIT}
            placeholder="今天想跟我说什么？"
            rows={6}
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
            <span>{draft.length}/{MESSAGE_LENGTH_LIMIT} · 别留密码、验证码或地址</span>
            <button type="submit" disabled={sending || (!draft.trim() && !image && !audio)}>{sending ? "送过去了…" : "送给魔王 →"}</button>
          </div>
          <p className="message-board__feedback" aria-live="polite">{feedback}</p>
        </form>
      </div>
    </section>
  );
}

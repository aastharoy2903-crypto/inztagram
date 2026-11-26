/**
 * Generates a lightweight, self-contained looping WebM video Blob using Canvas + MediaRecorder
 * when supported by the browser. Falls back to null if unavailable so UI renders a graceful fallback.
 */
const cachedVideoUrls = new Map<string, string>();

export async function generateDemoReelBlobUrl(
  theme: 'petal' | 'hydrangea' | 'twilight' | 'studio',
  title: string
): Promise<string | null> {
  const key = `${theme}:${title}`;
  if (cachedVideoUrls.has(key)) {
    return cachedVideoUrls.get(key) || null;
  }

  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof MediaRecorder === 'undefined'
  ) {
    return null;
  }

  const mimeCandidates = ['video/webm;codecs=vp8', 'video/webm'];
  const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!mimeType) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.captureStream !== 'function') return null;

    const stream = canvas.captureStream(24);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 350_000,
    });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const palettes: Record<
      'petal' | 'hydrangea' | 'twilight' | 'studio',
      [string, string, string]
    > = {
      petal: ['#F6E6F3', '#D57FC4', '#39243B'],
      hydrangea: ['#E8F1FF', '#B8D7FF', '#37689E'],
      twilight: ['#39243B', '#7B6A94', '#D57FC4'],
      studio: ['#F8F5FA', '#E5DCE9', '#B8D7FF'],
    };

    const [bgTop, bgBottom, accent] = palettes[theme];

    const done = new Promise<string | null>((resolve) => {
      recorder.onstop = () => {
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        cachedVideoUrls.set(key, url);
        resolve(url);
      };
      recorder.onerror = () => resolve(null);
    });

    let frame = 0;
    const totalFrames = 28; // ~1.2 seconds smooth loop at 24fps

    const drawFrame = () => {
      const t = (frame / totalFrames) * Math.PI * 2;
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(1, bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gentle drifting botanical circles
      for (let i = 0; i < 5; i++) {
        const cx = 180 + Math.sin(t + i * 1.3) * 68;
        const cy = 220 + i * 55 + Math.cos(t + i) * 26;
        const r = 46 + Math.sin(t * 2 + i) * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(213, 127, 196, 0.38)' : 'rgba(184, 215, 255, 0.48)';
        ctx.fill();
      }

      // Soft horizon bar
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(36, 480, 288, 2);
      ctx.globalAlpha = 1;

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(drawFrame);
      } else {
        recorder.stop();
      }
    };

    recorder.start();
    drawFrame();

    return await done;
  } catch {
    return null;
  }
}

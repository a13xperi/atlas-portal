import { createTextStream } from "../oracle";

test("cancel clears pending timer, no enqueue-after-close throw", async () => {
  const s = createTextStream("a b c d e f g h", 10);
  const r = s.getReader();
  await r.read();
  await r.cancel();
  await new Promise((res) => setTimeout(res, 100));
});

test("double cancel is idempotent", async () => {
  const s = createTextStream("a b c", 10);
  const r = s.getReader();
  await r.read();
  await r.cancel();
  await r.cancel();
  await new Promise((res) => setTimeout(res, 50));
});

test("breaking out of async iteration triggers cancel cleanly", async () => {
  const s = createTextStream("a b c d e f g h", 10);
  const reader = s.getReader();
  let count = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    count++;
    if (count === 2) {
      await reader.cancel();
      break;
    }
  }
  await new Promise((res) => setTimeout(res, 100));
  expect(count).toBe(2);
});

test("AbortController before first read yields nothing", async () => {
  const controller = new AbortController();
  controller.abort();
  const s = createTextStream("a b c", 10, controller.signal);
  const r = s.getReader();
  const { done } = await r.read();
  expect(done).toBe(true);
});

test("AbortController abort during stream stops further yields", async () => {
  const controller = new AbortController();
  const s = createTextStream("a b c d e f g h", 10, controller.signal);
  const r = s.getReader();
  const first = await r.read();
  expect(first.done).toBe(false);
  controller.abort();
  // After abort, the stream errors so subsequent reads reject.
  await expect(r.read()).rejects.toThrow();
});

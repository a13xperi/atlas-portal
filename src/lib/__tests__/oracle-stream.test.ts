import { createTextStream } from "../oracle";

test("cancel clears pending timer, no enqueue-after-close throw", async () => {
  const s = createTextStream("a b c d e f g h", 10);
  const r = s.getReader();
  await r.read();
  await r.cancel();
  await new Promise((res) => setTimeout(res, 100));
});

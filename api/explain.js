export default function handler(req, res) {
  res
    .status(200)
    .json({ ok: true, msg: "API explain đang hoạt động trên Vercel!" });
}

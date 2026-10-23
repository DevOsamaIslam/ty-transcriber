import { index, route } from "@react-router/dev/routes";

export default [
  index("./routes/index.tsx"),
  route("/transcripts/:id", "./routes/transcripts.$id.tsx"),
];
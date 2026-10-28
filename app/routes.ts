import { index, route } from "@react-router/dev/routes";

export default [
  index("./routes/index.tsx"),
  route("/transcripts/playlist/:playlistId", "./routes/transcriptsPlaylist.tsx"),
  route("/transcripts/channel/:channel", "./routes/transcriptsChannel.tsx"),
  route("/transcripts/:id", "./routes/transcripts.$id.tsx"),
];
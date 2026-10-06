import "dotenv/config";
import app from "@/app";

const PORT =
  Number((process.env as Record<string, string | undefined>)["PORT"]) || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
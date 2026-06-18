import app from "./api/index";

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Droguería Backend] running on http://0.0.0.0:${PORT}`);
});

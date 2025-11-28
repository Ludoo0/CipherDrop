import express from "express";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());






// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
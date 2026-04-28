import { Router } from "express";

const router = Router();

router.post("/register", async (req, res) => {
  // TODO: implement with mongoose User model + bcrypt + JWT
  res.json({ message: "Register endpoint — implement with MongoDB" });
});

router.post("/login", async (req, res) => {
  // TODO: implement with mongoose User model + bcrypt + JWT
  res.json({ message: "Login endpoint — implement with MongoDB" });
});

export default router;

const express = require("express");
const router  = express.Router();
const { auth }= require("../middlewares/authMiddleware");
const Share   = require("../models/Share");
const Sequence = require("../models/Sequence");
const Thread  = require("../models/Thread");
const Post    = require("../models/Post");
const Challenge = require("../models/Challenge");
const User = require("../models/User");

// Shares
router.post("/share", auth, async (req, res) => {
  try {
    const { type, reference, caption, toUser } = req.body;
    const share = await Share.create({
      from:      req.user._id,
      to:        toUser,
      type,
      reference,
      caption:   caption || undefined
    });
    res.status(201).json(share);
  } catch (err) {
    console.error("Error creating share:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shares", auth, async (req, res) => {
  try {
    const mine = req.query.mine === "true";
    const filter = mine
      ? { from: req.user._id }
      : { to: req.user._id };

    const shares = await Share.find(filter)
      .sort({ createdAt: -1 })
      .populate("from", "name email")
      .populate("to", "name email")
      .populate("reference");

    const validShares = shares.filter(s => s.reference && s.reference.name);

    res.json(validShares);
  } catch (err) {
    console.error("Error fetching shares:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shares/debug", auth, async (req, res) => {
  const shares = await Share.find().populate("reference");
  res.json(shares);
});



router.get("/users", auth, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json([]);
  const user = await User.findOne({ email: email.toLowerCase() }).select("name email");
  if (!user) return res.json([]);
  res.json([user]);
});

// Forum
// Create a thread
router.post("/threads", auth, async (req,res)=>{
  const thread = new Thread({ title:req.body.title, createdBy:req.user._id });
  await thread.save();
  res.status(201).json(thread);
});
// List threads
router.get("/threads", async (req,res)=>{
  const threads = await Thread.find().populate("createdBy","name");
  res.json(threads);
});
// Add post
router.post("/threads/:id/posts", auth, async (req,res)=>{
  const post = new Post({ thread:req.params.id, author:req.user._id, content:req.body.content });
  await post.save();
  res.status(201).json(post);
});
// Get posts for a thread
router.get("/threads/:id/posts", async (req,res)=>{
  const posts = await Post.find({ thread: req.params.id }).populate("author","name");
  res.json(posts);
});

// Challenges
router.post("/challenges", auth, async (req,res)=>{
  const challenge = new Challenge({ 
    name: req.body.name,
    description: req.body.description,
    creator: req.user._id,
    endsAt: req.body.endsAt,
    sequence: req.body.sequenceId
  });
  await challenge.save();
  res.status(201).json(challenge);
});
router.get("/challenges", auth, async (req,res)=>{
  const challenges = await Challenge.find().populate("creator","name").populate("participants","name");
  res.json(challenges);
});
router.post("/challenges/:id/join", auth, async (req,res)=>{
  const c = await Challenge.findById(req.params.id);
  if(!c.participants.includes(req.user._id)){
    c.participants.push(req.user._id);
    await c.save();
  }
  res.json(c);
});

module.exports = router;

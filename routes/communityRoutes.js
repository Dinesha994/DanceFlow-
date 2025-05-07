const express = require("express");
const router  = express.Router();
const { auth }= require("../middlewares/authMiddleware");
const Share   = require("../models/Share");
const Sequence = require("../models/Sequence");
const Session = require("../models/Session");
const Thread  = require("../models/Thread");
const Post    = require("../models/Post");
const Challenge = require("../models/Challenge");
const User = require("../models/User");

// Shares
router.post("/share", auth, async (req, res) => {
  try {
    let { type, reference, caption, toUser } = req.body;
    type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
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
    const filter = mine ? { from: req.user._id } : { to: req.user._id };

    let shares = await Share.find(filter)
      .populate('from', 'name email')
      .populate('to', 'name email')
      .sort({ createdAt: -1 });

    await Promise.all(shares.map(async (share) => {
      if (share.type === 'Session') {
        await share.populate({ path: 'reference', model: 'Session' });
      } else if (share.type === 'Sequence') {
        await share.populate({ path: 'reference', model: 'Sequence' });
      }
    }));

    const validShares = shares.filter(s => s.reference); 
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

router.delete("/threads/:id", auth, async (req, res) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (!thread.createdBy.equals(req.user._id)) return res.status(403).json({ error: "Unauthorized" });

  await thread.deleteOne();
  res.json({ success: true });
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

router.get('/challenges', auth, async (req, res) => {
  const userId = req.user._id.toString();

  const challenges = await Challenge.find()
    .populate('creator', 'name')
    .populate('participants', '_id') 
    .populate('comments.user', 'name') 
    .lean();

  const withNotes = challenges.map(challenge => ({
    ...challenge,
    userNote: challenge.userNotes?.[userId] || ""
  }));

  res.json(withNotes);
});

router.delete("/challenges/:id", auth, async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });
  if (!challenge.creator.equals(req.user._id)) return res.status(403).json({ error: "Unauthorized" });

  await challenge.deleteOne();
  res.json({ success: true });
});


router.post("/challenges/:id/join", auth, async (req,res)=>{
  const c = await Challenge.findById(req.params.id);
  if(!c.participants.includes(req.user._id)){
    c.participants.push(req.user._id);
    await c.save();
  }
  res.json(c);
});


router.post("/challenges/:id/comment", auth, async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const isJoined = challenge.participants.some(p =>
    p.toString() === req.user._id.toString()
  );
  if (!isJoined) {
    return res.status(403).json({ error: "You must join the challenge to comment" });
  }

  challenge.comments.push({
    user: req.user._id, 
    content: req.body.content
  });

  await challenge.save();
  res.json({ success: true });
});




// GET comments for a challenge
router.get("/challenges/:id/comments", auth, async (req, res) => {
  try {

    const challenge = await Challenge.findById(req.params.id)
      .populate("comments.user", "name");

    if (!challenge) return res.status(404).json({ error: "Challenge not found" });

    const comments = (challenge.comments || []).map(c => ({
      user: c.user?.name || "Anonymous",
      userId: c.user?._id?.toString(),
      content: c.content || "No content"
    }));

    res.json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: "Server error" });
  }
});





module.exports = router;

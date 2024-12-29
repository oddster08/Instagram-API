const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = mongoose.model("Post");
const User = mongoose.model("User");

router.get('/user/:id', requireLogin, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ postedBy: req.params.id })
            .populate("postedBy", "_id name");

        res.json({ user, posts });
    } catch (err) {
        res.status(422).json({ error: "User not found" });
    }
});

router.put("/follow", requireLogin, async (req, res) => {
    try {
        // First update the 'followers' of the user being followed
        const result1 = await User.findByIdAndUpdate(req.body.followId, {
            $push: { followers: req.user._id }
        }, { new: true });

        // Then update the 'following' of the current logged-in user
        const result2 = await User.findByIdAndUpdate(req.user._id, {
            $push: { following: req.body.followId }
        }, { new: true }).select("-password");

        res.json(result2);
    } catch (err) {
        res.status(422).json({ error: err });
    }
});

router.put("/unfollow", requireLogin, async (req, res) => {
    try {
        
        const result1 = await User.findByIdAndUpdate(req.body.unfollowId, {
            $pull: { followers: req.user._id }
        }, { new: true });

        
        const result2 = await User.findByIdAndUpdate(req.user._id, {
            $pull: { following: req.body.unfollowId }
        }, { new: true }).select("-password");

        res.json(result2);
    } catch (err) {
        res.status(422).json({ error: err });
    }
});

module.exports = router
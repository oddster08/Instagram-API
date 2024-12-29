const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = mongoose.model("Post");

router.get('/allPosts',requireLogin,(req,res) => {
    Post.find()
    .populate("postedBy","_id name")
    .then(posts => {
        res.json({posts});
    })
    .catch(err => {
        console.log(err);
    })
})
router.get('/getsubposts',requireLogin,(req,res) => {
    Post.find({postedBy:{$in:req.user.following}})
    .populate("postedBy","_id name")
    .then(posts => {
        res.json({posts});
    })
    .catch(err => {
        console.log(err);
    })
})

router.post('/createPost',requireLogin,(req,res) => {
    const {title,body} =req.body;
    if(!title || !body){
        res.status(422).send({error:"enter all the fields"});
    }
    // console.log(req.user);
    req.user.password = undefined;
    const post = new Post({
        title,
        body,
        postedBy:req.user
    })
    post.save().then(result => {
        res.json({post:result})
    })
    .catch(err => {
        console.log(err);
    })
})

router.get('/myposts',requireLogin,(req,res) => {
    
    Post.find({postedBy:req.user._id})
    .populate("postedBy","_id name")
    .then(posts => {
        res.json({posts});
    })
    .catch(err => {
        console.log(err);
    })
})

router.put('/like', requireLogin, (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { likes: req.user._id } },
        { new: true }
    )
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(422).json({ error: err });
    });
});


router.put('/unlike', requireLogin, (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { likes: req.user._id } },
        { new: true }
    )
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(422).json({ error: err });
    });
});


router.put('/comment', requireLogin, (req, res) => {
    const comment = {
        text: req.body.text,
        postedBy: req.user._id
    };

    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { comments: comment } },
        { new: true }
    )
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name")
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(422).json({ error: err });
    });
});


router.delete('/deletePost/:postId', requireLogin, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.postId })
        .populate('postedBy', '_id');
        if (!post) {
            return res.status(422).json({ error: "Post not found" });
        }

        // Check if the user is authorized to delete the post
        if (post.postedBy._id.toString() === req.user._id.toString()) {
            await post.deleteOne({ _id: req.params.postId });
            return res.json({ message: "Successfully deleted" });
        } else {
            return res.status(403).json({ error: "You are not authorized to delete this post" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred" });
    }
});


module.exports = router
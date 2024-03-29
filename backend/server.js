const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors middleware
const multer = require('multer');
const path = require('path');
 
const app = express();
const PORT = 5000;
 
// Enable CORS middleware
// app.use(cors({
//     origin: ["https://social-media-dashboard-frontend.vercel.app"],
//     methods: ["POST","GET"],
//     credentials: true
// }));
// app.use(cors());
// app.options("*", cors());

const allowedOrigins = ['https://social-media-dashboard-frontend.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
 
const upload = multer({ storage: storage });
const pass = encodeURIComponent("Rajan@060399");
const DB = `mongodb+srv://rajansuhagiya1234g:${pass}@cluster0.pklen1x.mongodb.net/social?retryWrites=true&w=majority`;

mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true})
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    file: String,
    likes: { type: Number, default: 0 },
    comments: [{ text: String }],
});
 
const Post = mongoose.model('Post', postSchema);
 
app.use(bodyParser.json());
 
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
app.post('/api/posts', upload.single('file'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const file = req.file ? req.file.filename : undefined;
 
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required fields' });
        }
 
        const post = new Post({ title, content, file });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
app.post('/api/posts/like/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
 
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
 
        post.likes += 1;
        await post.save();
 
        res.json(post);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
app.post('/api/posts/comment/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { text } = req.body;
        const post = await Post.findById(postId);
 
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
 
        post.comments.push({ text });
        await post.save();
 
        res.json(post);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const body = request.body
  const user = response.user

  if (!user) {
    return response.status(401).json({ error: 
      'token missing or invalid '
    })
  }

  const blog = new Blog({
    title: body.title,
    author: body.author === undefined ? '': body.author,
    url: body.url,
    likes: body.likes === undefined ? 0: body.likes,
    user: user._id
  })

  const savedBlog = await blog.save()
  await savedBlog.populate('user', { username: 1, name: 1 })
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(response.token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ 
      error: 'token missing or invalid '
    })
  }
  const blog = await Blog.findById(request.params.id)
  const user = await User.findById(decodedToken.id)
  if (blog && user && (
    // If no user specified, allow blog delete, otherwise check user is blog creator
    blog.user === undefined || blog.user.toString() === user._id.toString())) {
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  } else {
    return response.status(401).json({
      error: 'unauthorized delete'
    })
  }
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body
  
  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  const updatedBlog = await Blog
    .findByIdAndUpdate(request.params.id, blog, { new: true})
    .populate('user', { username: 1, name: 1 })

  if (updatedBlog) {
    response.json(updatedBlog)
  }
  else {
    response.status(404).end()
  }
})

module.exports = blogsRouter
const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'JavaScript for Geniuses',
    url: 'www.javascripverygood.com',
    likes: 10
  },
  {
    title: 'Python is a Snake',
    url: 'www.pythonisasnake.com',
    likes: 20
  }
]

const nonExistingId = async () => {
  const blog = new Blog(
    { 
      title: 'willremovethissoon',
      url: 'www.toBeDeleted.com'
    }
  )
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const getBlogById = async (id) => {
  const blog = await Blog.findById(id)
  return blog.toJSON()
}

const usersinDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}
module.exports = {
  initialBlogs,
  nonExistingId, 
  blogsInDb, 
  getBlogById, 
  usersinDb
}
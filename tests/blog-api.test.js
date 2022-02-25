const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {  
  await Blog.deleteMany({})  
  await Blog.insertMany(helper.initialBlogs)
})

describe('when there are some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api.get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
  
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('there is a unique identifier called id in blogs', async () => {
    const blogs = await helper.blogsInDb()

    expect(blogs[0].id).toBeDefined()
    expect(blogs[1].id).toBeDefined()
    expect(blogs[0].id).not.toEqual(blogs[1].id)
  })
})

describe('adding a new blog', () => {
  test('POST-ing a blog creates a new blog in the database', async () => {
    const newBlog = {
      'title' : 'This blog should be added', 
      'url': 'https://www.newBlog.com',
      'likes': 100
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await helper.blogsInDb()

    const titles = blogs.map(r => r.title)

    expect(blogs).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain(
      'This blog should be added'
    )
  })

  test('POST-ing a blog with missing likes defaults to 0 likes', async () => {
    const newBlog = {
      'title' : 'Zero likes blog', 
      'url': 'https://www.unpopularblog.com',
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await helper.blogsInDb()

    const findTitle = (blog) => (blog.title === 'Zero likes blog')

    const foundBlog = blogs.find(findTitle)
    expect(blogs).toHaveLength(helper.initialBlogs.length + 1)
    expect(foundBlog.likes).toBeDefined()
    expect(foundBlog.likes).toBe(0)
  })

  test('POST-ing a blog with missing title or url gets response 400', async () => {
    const missingTitle = { 
      'url': 'https://www.notitle.com',
      'likes': 2
    }

    const missingUrl = {
      'title': 'missing url',
      'likes': 5
    }
    await api
      .post('/api/blogs')
      .send(missingTitle)
      .expect(400)

    await api
      .post('/api/blogs')
      .send(missingUrl)
      .expect(400)

    const blogs = await helper.blogsInDb()

    expect(blogs).toHaveLength(helper.initialBlogs.length)
  })
})

describe('deletion of a blog', () => {
  test('deletion of a specifc blog succeeds status code 204 if id valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length -1)

    const titles = blogsAtEnd.map(b => b.title)

    expect(titles).not.toContain(blogToDelete.title)
  })
})

test('deletion of an invalid id does not change db, has status code 204', async () => {
  const nonExistingId = await helper.nonExistingId()

  await api
    .delete(`/api/blogs/${nonExistingId}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

describe('updating a blog', () => {
  test('updating a blog\'s likes updates DB and gets status code 200', async () => {
    const initialBlogs = await helper.blogsInDb()
    const blogToUpdate = initialBlogs[0]

    const updatedBlog = { ...blogToUpdate, likes: 12345 }
    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
    expect(response.body.likes).toBe(12345)
    const retrievedBlog = await helper.getBlogById(blogToUpdate.id)
    expect(retrievedBlog.likes).toBe(12345)
  })

  test('updating an invalid id gives status code 404', async () => {
    const nonExistingId = await helper.nonExistingId()
    const blog = 
    {   
      'title': 'updated blog',
      'author': 'moi',
      'url': 'www.updatedurl.com',
      'likes': 40
    }

    await api
      .put(`/api/blogs/${nonExistingId}`)
      .send(blog)
      .expect(404)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
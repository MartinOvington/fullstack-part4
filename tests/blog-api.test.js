const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')

var loginToken = ''
var userId = ''

beforeAll(async () => {
  await User.deleteMany({})

  const newUser = {
    username: 'jerry',
    name: 'Jerry Seinfeld',
    password: 'testpassword'
  }

  const login = {
    username: 'jerry',
    password: 'testpassword'
  }

  const userResponse = await api
    .post('/api/users')
    .send(newUser)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  userId = userResponse.body._id

  const loginResponse = await api
    .post('/api/login')
    .send(login)
    .expect(200)
  
  loginToken = loginResponse.body.token
})

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
      'likes': 100,
      'user': userId
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loginToken}`)
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

  test('adding a blog with missing likes defaults to 0 likes', async () => {
    const newBlog = {
      'title' : 'Zero likes blog', 
      'url': 'https://www.unpopularblog.com',
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loginToken}`)
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

  test('adding a blog with missing title or url gets response 400', async () => {
    const missingTitle = { 
      'url': 'https://www.notitle.com',
      'likes': 2,
    }

    const missingUrl = {
      'title': 'missing url',
      'likes': 5,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loginToken}`)
      .send(missingTitle)
      .expect(400)

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loginToken}`)
      .send(missingUrl)
      .expect(400)

    const blogs = await helper.blogsInDb()

    expect(blogs).toHaveLength(helper.initialBlogs.length)
  })

  test('adding a blog without toke fails with status code 401', async () => {
    const blogToAdd = {
      'title': 'should not be added',
      'url': 'https://www.google.com',
      'likes': 2,
    }

    await api
      .post('/api/blogs')
      .send(blogToAdd)
      .expect(401)

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
      .set('Authorization', `bearer ${loginToken}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length -1)

    const titles = blogsAtEnd.map(b => b.title)

    expect(titles).not.toContain(blogToDelete.title)
  })
})

test('deletion of an invalid blog id with valid token has status code 401', async () => {
  const nonExistingId = await helper.nonExistingId()

  await api
    .delete(`/api/blogs/${nonExistingId}`)
    .expect(401)

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
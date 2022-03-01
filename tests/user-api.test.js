const bcrypt = require('bcrypt')
const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')

describe('when there is initially one user in the db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('mypass', 10)
    const user = new User({ username: 'superuser', passwordHash })

    await user.save()
  })

  test('can create a new user', async () => {
    const usersAtStart = await helper.usersinDb()

    const newUser = {
      username: 'jerry',
      name: 'Jerry Seinfeld',
      password: 'testpassword'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersinDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('user creation fails with code 400 if username already taken', async () => {
    const usersAtStart = await helper.usersinDb()

    const newUser = {
      username: 'superuser',
      name: 'John',
      password: 'admin'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username must be unique')

    const usersAtEnd = await helper.usersinDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creating user with password of length 2 fails with status code 400', async () => {
    const usersAtStart = await helper.usersinDb()

    const newUser = {
      username: 'newuser',
      name: 'Marty',
      password: '12'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password must be at least 3 characters long')

    const usersAtEnd = await helper.usersinDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creating user without user name fails with status code 400', async () => {
    const usersAtStart = await helper.usersinDb()

    const newUser = {
      name: 'Marty',
      password: '12345'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('User validation failed')

    const usersAtEnd = await helper.usersinDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
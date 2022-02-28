const dummy = (blogs) => {
  blogs
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes
  }

  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const reducer = (sum, item) => {
    if (item.likes > sum.likes) {
      return item
    } else {
      return sum
    }
  }
  return blogs.length === 0
    ? null
    : blogs.reduce(reducer, blogs[0])
}

const mostBlogs = (blogs) => {
  const reducer = (sum, item) => {
    const index = sum.findIndex((blog) => item.author === blog.author)
    if (index > -1) {
      sum[index].blogs += 1
    } else {
      sum.push({ author: item.author, blogs: 1 })
    }
    return sum
  } 

  const blogCounts = blogs.reduce(reducer, [])

  let mostBlogs = null

  for (let i in blogCounts) {
    if (mostBlogs === null || blogCounts[i].blogs > mostBlogs.blogs) {
      mostBlogs = blogCounts[i]
    }
  }
  return mostBlogs
}

const mostLikes = (blogs) => {
  const reducer = (sum, item) => {
    const index = sum.findIndex((blog) => item.author === blog.author)
    if (index > -1) {
      if (sum[index].likes < item.likes) {
        sum[index].likes = item.likes
      }
    } else {
      sum.push({ author: item.author, likes: item.likes })
    }
    return sum
  } 

  const likeCounts = blogs.reduce(reducer, [])

  let mostLikes = null

  for (let i in likeCounts) {
    if (mostLikes === null || likeCounts[i].likes > mostLikes.likes) {
      mostLikes = likeCounts[i]
    }
  }
  return mostLikes
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
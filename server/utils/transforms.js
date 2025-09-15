// Transform user object to match client-side interface
const transformUser = (user) => {
  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email
  };
};

module.exports = {
  transformUser
};
module.exports = {
  '*.[jt]s': (files) => `eslint ${files.join(' ')}`
}

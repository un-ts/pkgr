import imagemin from '.'

Promise.all(process.argv.slice(2).map(imagemin)).catch(e => {
  console.error(e)
  process.exitCode = 1
})

const checkVersion = () => axios
.get(`${location.href}version?${Date.now()}`)
.then(({data})=>{
  if(data.trim() != revision) location.reload();
})
.catch(error=>console.error)

setInterval(checkVersion,1000)

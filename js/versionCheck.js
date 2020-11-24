const checkVersion = axios
.get(`version?${Date.now()}`)
.then(({data})=>{
  if(data.trim() != revision) location.reload
})  

setInterval(checkVersion,1000)

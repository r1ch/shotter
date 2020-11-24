const checkVersion = () => {
   axios
  .get(`${config.versionPath}?${Date.now()}`)
  .then(({data})=>{
    if(data.trim() != revision) location.reload();
  })
  .catch(error=>console.error)
}

setInterval(checkVersion,1000)

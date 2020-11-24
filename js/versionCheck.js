const checkVersion = () => {
   axios
  .get(config.versionPath)
  .then(({data})=>{
    if(data.trim() != revision) location.reload();
  })
  .catch(error=>console.error)
}

setInterval(checkVersion,1000)

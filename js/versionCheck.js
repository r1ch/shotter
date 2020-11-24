const checkVersion = () => {
   axios.get(`version/index.html?${Date.now()}`)
  .then(({data})=>{
    console.log(data)
    if(data.trim() != revision) location.reload();
  })
  .catch(error=>console.error)
}

setInterval(checkVersion,config.checkFrequency)
